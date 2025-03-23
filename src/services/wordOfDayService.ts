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
    definition: 'Too great to express',
    example: 'The ineffable beauty of the night sky',
    date: todayStr, // Today's actual date
    options: [
      { value: 'Too great to express', isCorrect: true },
      { value: 'Causing great fear', isCorrect: false },
      { value: 'Pleasant smelling', isCorrect: false },
      { value: 'Happening by chance', isCorrect: false }
    ]
  },
  {
    id: '2',
    word: 'serendipity',
    pronunciation: '/ˌsɛrənˈdɪpɪti/',
    partOfSpeech: 'noun',
    definition: 'Happy accidental discovery',
    example: 'A fortunate happenstance of meeting an old friend',
    date: yesterdayStr, // Yesterday's actual date
    options: [
      { value: 'Happy accidental discovery', isCorrect: true },
      { value: 'Peace and tranquility', isCorrect: false },
      { value: 'Unusual vision ability', isCorrect: false },
      { value: 'Extended joy period', isCorrect: false }
    ]
  },
  {
    id: '3',
    word: 'ephemeral',
    pronunciation: '/ɪˈfɛm(ə)rəl/',
    partOfSpeech: 'adjective',
    definition: 'Very short-lived',
    example: 'The ephemeral nature of fashion trends',
    date: '2025-03-15'
  },
  {
    id: '4',
    word: 'ubiquitous',
    pronunciation: '/juːˈbɪkwɪtəs/',
    partOfSpeech: 'adjective',
    definition: 'Found everywhere',
    example: 'Smartphones have become ubiquitous in modern life',
    date: '2025-03-14'
  },
  {
    id: '5',
    word: 'mellifluous',
    pronunciation: '/məˈlɪfluəs/',
    partOfSpeech: 'adjective',
    definition: 'Sweetly sounding',
    example: "The singer's mellifluous voice captivated the audience",
    date: '2025-03-13'
  },
  {
    id: '6',
    word: 'eloquent',
    pronunciation: '/ˈɛləkwənt/',
    partOfSpeech: 'adjective',
    definition: 'Fluent and persuasive',
    example: 'Her eloquent speech moved everyone to tears',
    date: '2025-03-12'
  },
  {
    id: '7',
    word: 'resilience',
    pronunciation: '/rɪˈzɪlɪəns/',
    partOfSpeech: 'noun',
    definition: 'Quick recovery ability',
    example: 'He showed remarkable resilience in the face of adversity',
    date: '2025-03-11'
  },
  {
    id: '8',
    word: 'meticulous',
    pronunciation: '/məˈtɪkjʊləs/',
    partOfSpeech: 'adjective',
    definition: 'Extremely careful',
    example: 'His meticulous research uncovered new evidence',
    date: '2025-03-10'
  },
  {
    id: '9',
    word: 'perspicacious',
    pronunciation: '/ˌpəːspɪˈkeɪʃəs/',
    partOfSpeech: 'adjective',
    definition: 'Insightful understanding',
    example: 'Her perspicacious comments revealed the truth of the situation',
    date: '2025-03-09'
  },
  {
    id: '10',
    word: 'sycophant',
    pronunciation: '/ˈsɪkəfənt/',
    partOfSpeech: 'noun',
    definition: 'Servile flatterer',
    example: 'The CEO was surrounded by sycophants who agreed with everything he said',
    date: '2025-03-08'
  },
  {
    id: '11',
    word: 'cacophony',
    pronunciation: '/kəˈkɒfəni/',
    partOfSpeech: 'noun',
    definition: 'Harsh sound mixture',
    example: 'The cacophony of the busy market made conversation difficult',
    date: '2025-03-07'
  },
  {
    id: '12',
    word: 'quintessential',
    pronunciation: '/ˌkwɪntɪˈsɛnʃ(ə)l/',
    partOfSpeech: 'adjective',
    definition: 'Perfect typical example',
    example: 'The quintessential New York experience includes a walk through Central Park',
    date: '2025-03-06'
  },
  {
    id: '13',
    word: 'juxtaposition',
    pronunciation: '/ˌdʒʌkstəpəˈzɪʃ(ə)n/',
    partOfSpeech: 'noun',
    definition: 'Side-by-side contrast',
    example: 'The juxtaposition of ancient and modern architecture created a unique cityscape',
    date: '2025-03-05'
  },
  {
    id: '14',
    word: 'benevolent',
    pronunciation: '/bəˈnɛvələnt/',
    partOfSpeech: 'adjective',
    definition: 'Kind and generous',
    example: 'The benevolent donor gave generously to the charity',
    date: '2025-03-04'
  },
  // New mock data for March 17-21, 2025
  {
    id: '15',
    word: 'serendipitous',
    pronunciation: '/ˌserənˈdɪpɪtəs/',
    partOfSpeech: 'adjective',
    definition: 'Occurring by chance in a happy way',
    example: 'Their serendipitous meeting at the café led to a lifelong friendship',
    date: '2025-03-17',
    options: [
      { value: 'Occurring by chance in a happy way', isCorrect: true },
      { value: 'Extremely difficult to achieve', isCorrect: false },
      { value: 'Relating to ancient wisdom', isCorrect: false },
      { value: 'Painfully obvious to everyone', isCorrect: false }
    ]
  },
  {
    id: '16',
    word: 'loquacious',
    pronunciation: '/ləˈkweɪʃəs/',
    partOfSpeech: 'adjective',
    definition: 'Tending to talk a great deal',
    example: 'The loquacious presenter barely let anyone else speak during the meeting',
    date: '2025-03-18',
    options: [
      { value: 'Tending to talk a great deal', isCorrect: true },
      { value: 'Extremely quiet and reserved', isCorrect: false },
      { value: 'Full of clever wordplay', isCorrect: false },
      { value: 'Prone to telling lies', isCorrect: false }
    ]
  },
  {
    id: '17',
    word: 'equanimity',
    pronunciation: '/ˌekwəˈnɪmɪti/',
    partOfSpeech: 'noun',
    definition: 'Mental calmness and composure',
    example: 'She maintained her equanimity despite the chaotic situation',
    date: '2025-03-19',
    options: [
      { value: 'Mental calmness and composure', isCorrect: true },
      { value: 'Physical balance and coordination', isCorrect: false },
      { value: 'Equal distribution of resources', isCorrect: false },
      { value: 'Fairness in judgment', isCorrect: false }
    ]
  },
  {
    id: '18',
    word: 'obfuscate',
    pronunciation: '/ˈɒbfʌskeɪt/',
    partOfSpeech: 'verb',
    definition: 'Make obscure or unclear',
    example: 'The politician tried to obfuscate the facts with complicated jargon',
    date: '2025-03-20',
    options: [
      { value: 'Make obscure or unclear', isCorrect: true },
      { value: 'Brighten or illuminate', isCorrect: false },
      { value: 'Strengthen or fortify', isCorrect: false },
      { value: 'Simplify or streamline', isCorrect: false }
    ]
  },
  {
    id: '19',
    word: 'insouciant',
    pronunciation: '/ɪnˈsuːsɪənt/',
    partOfSpeech: 'adjective',
    definition: 'Showing casual lack of concern',
    example: 'The insouciant teenager shrugged off his parents\' warnings',
    date: '2025-03-21',
    options: [
      { value: 'Showing casual lack of concern', isCorrect: true },
      { value: 'Extremely attentive to detail', isCorrect: false },
      { value: 'Overly worried about everything', isCorrect: false },
      { value: 'Deeply thoughtful and reflective', isCorrect: false }
    ]
  },
];

/**
 * Service class for handling Word of the Day operations
 * This mock implementation will be replaced with Supabase integration
 */
class WordOfDayService {
  /**
   * Generate options for a word if they don't exist
   * @param word The word to generate options for
   * @returns Word with options added
   */
  private ensureOptions(word: WordOfDay): WordOfDay {
    if (word.options && word.options.length > 0) {
      return word; // Already has options
    }
    
    // Create options with the correct definition and 3 made-up ones
    const options = [
      { value: word.definition, isCorrect: true },
      { value: `Opposite of ${word.word}`, isCorrect: false },
      { value: `Related to ancient ${word.partOfSpeech === 'noun' ? 'rituals' : 'practices'}`, isCorrect: false },
      { value: `Unusual ${word.partOfSpeech === 'noun' ? 'object' : 'quality'}`, isCorrect: false }
    ];
    
    return {
      ...word,
      options
    };
  }

  /**
   * Get word of the day for a specific date
   * @param date Date in ISO format (YYYY-MM-DD)
   * @returns WordOfDay object or undefined if not found
   */
  getWordByDate(date: string): WordOfDay | undefined {
    const word = mockWords.find(word => word.date === date);
    return word ? this.ensureOptions(word) : undefined;
  }

  /**
   * Get words for a date range
   * @param startDate Start date in ISO format (YYYY-MM-DD)
   * @param endDate End date in ISO format (YYYY-MM-DD)
   * @returns Array of WordOfDay objects
   */
  getWordsByDateRange(startDate: string, endDate: string): WordOfDay[] {
    return mockWords
      .filter(word => word.date >= startDate && word.date <= endDate)
      .map(word => this.ensureOptions(word))
      .sort((a, b) => b.date.localeCompare(a.date)); // Descending order
  }

  /**
   * Get all available words
   * @returns Array of all WordOfDay objects
   */
  getAllWords(): WordOfDay[] {
    return [...mockWords]
      .map(word => this.ensureOptions(word))
      .sort((a, b) => b.date.localeCompare(a.date)); // Descending order
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