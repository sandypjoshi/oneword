import { WordOfDay } from '../types/wordOfDay';

// Get today's and yesterday's dates in ISO format
const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const todayStr = today.toISOString().split('T')[0];
const yesterdayStr = yesterday.toISOString().split('T')[0];

// Mock data for words of the day with correct dates
const mockWords: WordOfDay[] = [
  {
    id: '1',
    word: 'ineffable',
    pronunciation: '/ɪnˈɛfəb(ə)l/',
    partOfSpeech: 'adjective',
    definition: 'Too great or extreme to be expressed or described in words',
    example: 'The ineffable beauty of the night sky',
    date: todayStr // Today's actual date
  },
  {
    id: '2',
    word: 'serendipity',
    pronunciation: '/ˌsɛrənˈdɪpɪti/',
    partOfSpeech: 'noun',
    definition: 'The occurrence and development of events by chance in a happy or beneficial way',
    example: 'A fortunate happenstance of meeting an old friend',
    date: yesterdayStr // Yesterday's actual date
  },
  {
    id: '3',
    word: 'ephemeral',
    pronunciation: '/ɪˈfɛm(ə)rəl/',
    partOfSpeech: 'adjective',
    definition: 'Lasting for a very short time',
    example: 'The ephemeral nature of fashion trends',
    date: '2025-03-15'
  },
  {
    id: '4',
    word: 'ubiquitous',
    pronunciation: '/juːˈbɪkwɪtəs/',
    partOfSpeech: 'adjective',
    definition: 'Present, appearing, or found everywhere',
    example: 'Smartphones have become ubiquitous in modern life',
    date: '2025-03-14'
  },
  {
    id: '5',
    word: 'mellifluous',
    pronunciation: '/məˈlɪfluəs/',
    partOfSpeech: 'adjective',
    definition: 'Sweet or musical; pleasant to hear',
    example: "The singer's mellifluous voice captivated the audience",
    date: '2025-03-13'
  },
  {
    id: '6',
    word: 'eloquent',
    pronunciation: '/ˈɛləkwənt/',
    partOfSpeech: 'adjective',
    definition: 'Fluent or persuasive in speaking or writing',
    example: 'Her eloquent speech moved everyone to tears',
    date: '2025-03-12'
  },
  {
    id: '7',
    word: 'resilience',
    pronunciation: '/rɪˈzɪlɪəns/',
    partOfSpeech: 'noun',
    definition: 'The capacity to recover quickly from difficulties; toughness',
    example: 'He showed remarkable resilience in the face of adversity',
    date: '2025-03-11'
  },
  {
    id: '8',
    word: 'meticulous',
    pronunciation: '/məˈtɪkjʊləs/',
    partOfSpeech: 'adjective',
    definition: 'Showing great attention to detail; very careful and precise',
    example: 'His meticulous research uncovered new evidence',
    date: '2025-03-10'
  },
  {
    id: '9',
    word: 'perspicacious',
    pronunciation: '/ˌpəːspɪˈkeɪʃəs/',
    partOfSpeech: 'adjective',
    definition: 'Having a ready insight into and understanding of things',
    example: 'Her perspicacious comments revealed the truth of the situation',
    date: '2025-03-09'
  },
  {
    id: '10',
    word: 'sycophant',
    pronunciation: '/ˈsɪkəfənt/',
    partOfSpeech: 'noun',
    definition: 'A person who acts obsequiously toward someone important in order to gain advantage',
    example: 'The CEO was surrounded by sycophants who agreed with everything he said',
    date: '2025-03-08'
  },
  {
    id: '11',
    word: 'cacophony',
    pronunciation: '/kəˈkɒfəni/',
    partOfSpeech: 'noun',
    definition: 'A harsh, discordant mixture of sounds',
    example: 'The cacophony of the busy market made conversation difficult',
    date: '2025-03-07'
  },
  {
    id: '12',
    word: 'quintessential',
    pronunciation: '/ˌkwɪntɪˈsɛnʃ(ə)l/',
    partOfSpeech: 'adjective',
    definition: 'Representing the most perfect or typical example of a quality or class',
    example: 'The quintessential New York experience includes a walk through Central Park',
    date: '2025-03-06'
  },
  {
    id: '13',
    word: 'juxtaposition',
    pronunciation: '/ˌdʒʌkstəpəˈzɪʃ(ə)n/',
    partOfSpeech: 'noun',
    definition: 'The fact of two things being seen or placed close together with contrasting effect',
    example: 'The juxtaposition of ancient and modern architecture created a unique cityscape',
    date: '2025-03-05'
  },
  {
    id: '14',
    word: 'benevolent',
    pronunciation: '/bəˈnɛvələnt/',
    partOfSpeech: 'adjective',
    definition: 'Well meaning and kindly',
    example: 'The benevolent donor gave generously to the charity',
    date: '2025-03-04'
  },
];

/**
 * Service class for handling Word of the Day operations
 * This mock implementation will be replaced with Supabase integration
 */
class WordOfDayService {
  /**
   * Get word of the day for a specific date
   * @param date Date in ISO format (YYYY-MM-DD)
   * @returns WordOfDay object or undefined if not found
   */
  getWordByDate(date: string): WordOfDay | undefined {
    return mockWords.find(word => word.date === date);
  }

  /**
   * Get words for a date range
   * @param startDate Start date in ISO format (YYYY-MM-DD)
   * @param endDate End date in ISO format (YYYY-MM-DD)
   * @returns Array of WordOfDay objects
   */
  getWordsByDateRange(startDate: string, endDate: string): WordOfDay[] {
    return mockWords.filter(word => 
      word.date >= startDate && word.date <= endDate
    ).sort((a, b) => b.date.localeCompare(a.date)); // Descending order
  }

  /**
   * Get all available words
   * @returns Array of all WordOfDay objects
   */
  getAllWords(): WordOfDay[] {
    return [...mockWords].sort((a, b) => b.date.localeCompare(a.date)); // Descending order
  }

  /**
   * Get words for the past n days including today
   * @param days Number of days to look back
   * @returns Array of WordOfDay objects
   */
  getWordsForPastDays(days: number): WordOfDay[] {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - (days - 1));
    
    const startDate = pastDate.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    return this.getWordsByDateRange(startDate, endDate);
  }
}

// Export singleton instance
export const wordOfDayService = new WordOfDayService(); 