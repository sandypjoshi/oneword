// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  try {
    // Define difficulty levels
    const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];
    const results = {};
    
    console.log("[DEBUG] Starting word count analysis");
    
    // Count words in the words table
    const { count: totalWordCount, error: totalCountError } = await supabaseClient
      .from('words')
      .select('*', { count: 'exact', head: true });
    
    if (totalCountError) {
      throw new Error(`Error counting words: ${totalCountError.message}`);
    }
    
    console.log(`[DEBUG] Total words in database: ${totalWordCount}`);
    results.totalWords = totalWordCount;
    
    // Count and get samples for each difficulty level
    const levelStats = [];
    
    for (const level of DIFFICULTY_LEVELS) {
      console.log(`[DEBUG] Analyzing difficulty level: ${level}`);
      
      // Count words with this difficulty level
      const { count: levelCount, error: levelCountError } = await supabaseClient
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('difficulty_level', level);
      
      if (levelCountError) {
        console.error(`[ERROR] Failed to count ${level} words: ${levelCountError.message}`);
        continue;
      }
      
      console.log(`[DEBUG] Words with difficulty level '${level}': ${levelCount || 0}`);
      
      // Get sample words for this level
      const { data: sampleWords, error: sampleError } = await supabaseClient
        .from('words')
        .select('word, definitions, difficulty_score')
        .eq('difficulty_level', level)
        .order('RANDOM()')
        .limit(5);
      
      if (sampleError) {
        console.error(`[ERROR] Failed to fetch sample ${level} words: ${sampleError.message}`);
      }
      
      // Count words with definitions
      const { count: withDefinitionsCount } = await supabaseClient
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('difficulty_level', level)
        .not('definitions', 'is', null);
      
      console.log(`[DEBUG] ${level} words with definitions: ${withDefinitionsCount || 0}`);
      
      // Count words with good definitions (array with at least one definition of 5+ chars)
      const { data: allWords } = await supabaseClient
        .from('words')
        .select('word, definitions')
        .eq('difficulty_level', level)
        .not('definitions', 'is', null)
        .limit(100);
      
      let goodDefinitionsCount = 0;
      if (allWords) {
        goodDefinitionsCount = allWords.filter(w => 
          Array.isArray(w.definitions) && 
          w.definitions.length > 0 && 
          w.definitions[0]?.length > 5
        ).length;
      }
      
      console.log(`[DEBUG] ${level} words with good definitions: ${goodDefinitionsCount} (out of 100 sample)`);
      
      levelStats.push({
        level,
        count: levelCount || 0,
        withDefinitions: withDefinitionsCount || 0,
        withGoodDefinitions: goodDefinitionsCount,
        sampleRatio: goodDefinitionsCount / (allWords?.length || 1),
        estimatedGoodDefinitions: Math.floor((levelCount || 0) * (goodDefinitionsCount / (allWords?.length || 100))),
        samples: sampleWords || []
      });
    }
    
    results.levelStats = levelStats;
    
    // Check recently used words (last 30 days)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    const pastDateStr = pastDate.toISOString().split('T')[0];
    
    const { data: recentWords, error: recentWordsError } = await supabaseClient
      .from('daily_words')
      .select('word, date')
      .gte('date', pastDateStr);
    
    if (recentWordsError) {
      console.error(`[ERROR] Failed to get recently used words: ${recentWordsError.message}`);
    } else {
      console.log(`[DEBUG] Recently used words (last 30 days): ${recentWords?.length || 0}`);
      results.recentlyUsedWords = recentWords?.length || 0;
      
      // Group by difficulty level
      const levelCounts = {};
      for (const level of DIFFICULTY_LEVELS) {
        levelCounts[level] = 0;
      }
      
      if (recentWords && recentWords.length > 0) {
        for (const recentWord of recentWords) {
          const { data: wordInfo } = await supabaseClient
            .from('words')
            .select('difficulty_level')
            .eq('word', recentWord.word)
            .maybeSingle();
          
          if (wordInfo && wordInfo.difficulty_level) {
            levelCounts[wordInfo.difficulty_level] = (levelCounts[wordInfo.difficulty_level] || 0) + 1;
          }
        }
      }
      
      console.log(`[DEBUG] Recently used words by level: ${JSON.stringify(levelCounts)}`);
      results.recentlyUsedByLevel = levelCounts;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        ...results
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[ERROR] Debug error:`, error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 