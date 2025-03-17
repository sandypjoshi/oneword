import { WordOfDay } from '../types/wordOfDay';

// Mock data for words of the day
const mockWords: WordOfDay[] = [
  {
    id: '1',
    word: 'serendipity',
    pronunciation: '/ˌsɛrənˈdɪpɪti/',
    partOfSpeech: 'noun',
    definition: 'The occurrence and development of events by chance in a happy or beneficial way',
    example: 'A fortunate happenstance or pleasant surprise',
    date: '2025-03-17' // Today
  },
  {
    id: '2',
    word: 'ephemeral',
    pronunciation: '/ɪˈfɛm(ə)rəl/',
    partOfSpeech: 'adjective',
    definition: 'Lasting for a very short time',
    example: 'Fashions are ephemeral',
    date: '2025-03-16'
  },
  {
    id: '3',
    word: 'ubiquitous',
    pronunciation: '/juːˈbɪkwɪtəs/',
    partOfSpeech: 'adjective',
    definition: 'Present, appearing, or found everywhere',
    example: 'Ubiquitous computing',
    date: '2025-03-15'
  },
  {
    id: '4',
    word: 'mellifluous',
    pronunciation: '/məˈlɪfluəs/',
    partOfSpeech: 'adjective',
    definition: 'Sweet or musical; pleasant to hear',
    example: "The singer's mellifluous voice",
    date: '2025-03-14'
  },
  {
    id: '5',
    word: 'eloquent',
    pronunciation: '/ˈɛləkwənt/',
    partOfSpeech: 'adjective',
    definition: 'Fluent or persuasive in speaking or writing',
    example: 'An eloquent speech',
    date: '2025-03-13'
  },
  {
    id: '6',
    word: 'resilience',
    pronunciation: '/rɪˈzɪlɪəns/',
    partOfSpeech: 'noun',
    definition: 'The capacity to recover quickly from difficulties; toughness',
    example: 'The resilience of the human spirit',
    date: '2025-03-12'
  },
  {
    id: '7',
    word: 'meticulous',
    pronunciation: '/məˈtɪkjʊləs/',
    partOfSpeech: 'adjective',
    definition: 'Showing great attention to detail; very careful and precise',
    example: 'Meticulous research',
    date: '2025-03-11'
  },
  {
    id: '8',
    word: 'pernicious',
    pronunciation: '/pərˈnɪʃəs/',
    partOfSpeech: 'adjective',
    definition: 'Having a harmful effect, especially in a gradual or subtle way',
    example: 'The pernicious effects of corruption',
    date: '2025-03-10'
  },
  {
    id: '9',
    word: 'sycophant',
    pronunciation: '/ˈsɪkəfənt/',
    partOfSpeech: 'noun',
    definition: 'A person who acts obsequiously toward someone important in order to gain advantage',
    example: 'Political sycophants',
    date: '2025-03-09'
  },
  {
    id: '10',
    word: 'cacophony',
    pronunciation: '/kəˈkɒfəni/',
    partOfSpeech: 'noun',
    definition: 'A harsh, discordant mixture of sounds',
    example: 'A cacophony of voices',
    date: '2025-03-08'
  },
  {
    id: '11',
    word: 'quintessential',
    pronunciation: '/ˌkwɪntɪˈsɛnʃ(ə)l/',
    partOfSpeech: 'adjective',
    definition: 'Representing the most perfect or typical example of a quality or class',
    example: 'The quintessential New York experience',
    date: '2025-03-07'
  },
  {
    id: '12',
    word: 'juxtaposition',
    pronunciation: '/ˌdʒʌkstəpəˈzɪʃ(ə)n/',
    partOfSpeech: 'noun',
    definition: 'The fact of two things being seen or placed close together with contrasting effect',
    example: 'The juxtaposition of the old and new buildings',
    date: '2025-03-06'
  },
  {
    id: '13',
    word: 'perfidious',
    pronunciation: '/pəˈfɪdɪəs/',
    partOfSpeech: 'adjective',
    definition: 'Deceitful and untrustworthy',
    example: 'Perfidious behavior',
    date: '2025-03-05'
  },
  {
    id: '14',
    word: 'benevolent',
    pronunciation: '/bəˈnɛvələnt/',
    partOfSpeech: 'adjective',
    definition: 'Well meaning and kindly',
    example: 'A benevolent gesture',
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