import { createClient } from '@supabase/supabase-js';
import { calculateWordDifficulty, DifficultyLevel } from './wordDifficulty';
import { isWordEligible } from './wordFilters';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Use service role key for managing daily words
);

interface DateRangeConfig {
  startDate: Date;
  endDate: Date;
  wordsPerDay: number;
  difficultyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

// Add interface for word assignments
interface WordAssignment {
  word: string;
  date: string;
  difficulty_level: string;
  difficulty_score: number;  // Make difficulty_score required again
}

export async function assignWordsForDateRange(config: DateRangeConfig) {
  try {
    const { startDate, endDate, wordsPerDay, difficultyDistribution } = config;
    
    // 1. Calculate total days and words needed
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalWordsNeeded = daysDiff * wordsPerDay;
    
    // 2. Get words not used in last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // First get the used word IDs
    const { data: usedWords, error: usedWordsError } = await supabase
      .from('daily_words')
      .select('word')
      .gte('date', sixMonthsAgo.toISOString());

    if (usedWordsError) throw usedWordsError;
    
    // Then get available words excluding used ones
    const { data: availableWords, error: wordsError } = await supabase
      .from('words')
      .select('*')
      .not('word', 'in', `(${usedWords?.map(w => `'${w.word}'`).join(',') || ''})`);

    if (wordsError) throw wordsError;
    if (!availableWords?.length) {
      throw new Error('No available words found');
    }

    // Filter out ineligible words
    const eligibleWords = availableWords.filter(word => {
      const check = isWordEligible(word.word);
      if (!check.isValid) {
        console.log(`Filtered out word "${word.word}": ${check.reason}`);
      }
      return check.isValid;
    });

    if (eligibleWords.length === 0) {
      throw new Error('No eligible words found after filtering');
    }

    // 3. Calculate difficulties for eligible words
    const wordsWithDifficulty = await Promise.all(
      eligibleWords.map(async (word) => {
        const difficulty = await calculateWordDifficulty(word.word);
        return { ...word, difficulty };
      })
    );

    // Log difficulty distribution
    const difficultyStats = wordsWithDifficulty.reduce((acc, word) => {
      acc[word.difficulty.level] = (acc[word.difficulty.level] || 0) + 1;
      return acc;
    }, {} as Record<DifficultyLevel, number>);
    
    console.log('Difficulty distribution after filtering:', difficultyStats);

    // 4. Group words by difficulty
    const wordsByDifficulty = {
      beginner: wordsWithDifficulty.filter(w => w.difficulty.level === 'beginner'),
      intermediate: wordsWithDifficulty.filter(w => w.difficulty.level === 'intermediate'),
      advanced: wordsWithDifficulty.filter(w => w.difficulty.level === 'advanced')
    };

    // Verify we have enough words of each difficulty
    Object.entries(wordsByDifficulty).forEach(([level, words]) => {
      const neededCount = Math.ceil(totalWordsNeeded * difficultyDistribution[level as DifficultyLevel]);
      if (words.length < neededCount) {
        throw new Error(`Not enough ${level} words available. Need ${neededCount}, have ${words.length}`);
      }
    });

    // 5. Assign words for each day
    const assignments: WordAssignment[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateWords: WordAssignment[] = [];
      
      // Calculate words needed for each difficulty level
      const dailyDistribution = {
        beginner: Math.round(wordsPerDay * difficultyDistribution.beginner),
        intermediate: Math.round(wordsPerDay * difficultyDistribution.intermediate),
        advanced: Math.round(wordsPerDay * difficultyDistribution.advanced)
      };

      // Select words for each difficulty level
      for (const [level, count] of Object.entries(dailyDistribution)) {
        const availableForLevel = wordsByDifficulty[level as DifficultyLevel];
        
        if (availableForLevel.length < count) {
          throw new Error(`Not enough ${level} words available`);
        }

        // Randomly select words
        const selectedIndices = new Set<number>();
        while (selectedIndices.size < count) {
          const index = Math.floor(Math.random() * availableForLevel.length);
          if (!selectedIndices.has(index)) {
            selectedIndices.add(index);
            const word = availableForLevel[index];
            dateWords.push({
              word: word.word,
              date: currentDate.toISOString().split('T')[0],
              difficulty_level: level,
              difficulty_score: word.difficulty.score
            });
          }
        }

        // Remove selected words from available pool
        const newAvailable = availableForLevel.filter((_, index) => 
          !selectedIndices.has(index)
        );
        wordsByDifficulty[level as DifficultyLevel] = newAvailable;
      }

      assignments.push(...dateWords);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 6. Insert assignments into database
    const { error: insertError } = await supabase
      .from('daily_words')
      .insert(assignments);

    if (insertError) throw insertError;

    return {
      success: true,
      assignedWords: assignments.length,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };

  } catch (error) {
    console.error('Error assigning words for date range:', error);
    throw error;
  }
}

export async function assignWordsForNextDay(wordsPerDay: number = 3) {
  try {
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Check if words are already assigned
    const { data: existingWords, error: checkError } = await supabase
      .from('daily_words')
      .select('*')
      .eq('date', tomorrow.toISOString().split('T')[0]);

    if (checkError) throw checkError;

    // If words already assigned, return early
    if (existingWords && existingWords.length >= wordsPerDay) {
      return {
        success: true,
        message: 'Words already assigned for tomorrow',
        existingWords
      };
    }

    // If not, assign new words
    const config: DateRangeConfig = {
      startDate: tomorrow,
      endDate: tomorrow,
      wordsPerDay,
      difficultyDistribution: {
        beginner: 0.4,
        intermediate: 0.4,
        advanced: 0.2
      }
    };

    return await assignWordsForDateRange(config);

  } catch (error) {
    console.error('Error assigning words for next day:', error);
    throw error;
  }
} 