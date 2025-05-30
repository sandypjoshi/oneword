import { WordOfDay } from '../types/wordOfDay';

// Get today's and yesterday's dates in ISO format
// const today = new Date(); // Unused
// const yesterday = new Date(); // Unused
// yesterday.setDate(today.getDate() - 1);
// const todayStr = today.toISOString().split('T')[0]; // Unused
// const yesterdayStr = yesterday.toISOString().split('T')[0]; // Unused

// Mock data for words of the day with fixed dates from May 12th to May 25th, 2025
const mockWords: WordOfDay[] = [
  {
    id: '1',
    word: 'ineffable',
    pronunciation: '/ɪnˈɛfəb(ə)l/',
    partOfSpeech: 'adjective',
    definition: 'Too great to express',
    example: 'The ineffable beauty of the night sky',
    date: '2025-05-25', // May 25th
    options: [
      { value: 'Too great to express', isCorrect: true },
      { value: 'Causing great fear', isCorrect: false },
      { value: 'Pleasant smelling', isCorrect: false },
      { value: 'Happening by chance', isCorrect: false },
    ],
  },
  {
    id: '2',
    word: 'serendipity',
    pronunciation: '/ˌsɛrənˈdɪpɪti/',
    partOfSpeech: 'noun',
    definition: 'Happy accidental discovery',
    example: 'Finding the perfect book was a delightful serendipity',
    date: '2025-05-24', // May 24th
    options: [
      { value: 'Happy accidental discovery', isCorrect: true },
      { value: 'Peace and tranquility', isCorrect: false },
      { value: 'Unusual vision ability', isCorrect: false },
      { value: 'Extended joy period', isCorrect: false },
    ],
  },
  {
    id: '3',
    word: 'ephemeral',
    pronunciation: '/ɪˈfɛm(ə)rəl/',
    partOfSpeech: 'adjective',
    definition: 'Very short-lived',
    example: 'The ephemeral nature of fashion trends',
    date: '2025-05-23', // May 23rd
    options: [
      { value: 'Very short-lived', isCorrect: true },
      { value: 'Eternally lasting', isCorrect: false },
      { value: 'Beautiful but sad', isCorrect: false },
      { value: 'Delicate and frail', isCorrect: false },
    ],
  },
  {
    id: '4',
    word: 'ubiquitous',
    pronunciation: '/juːˈbɪkwɪtəs/',
    partOfSpeech: 'adjective',
    definition: 'Found everywhere',
    example: 'Smartphones have become ubiquitous in modern life',
    date: '2025-05-22', // May 22nd
    options: [
      { value: 'Found everywhere', isCorrect: true },
      { value: 'Extremely rare', isCorrect: false },
      { value: 'Highly dangerous', isCorrect: false },
      { value: 'Ancient and historic', isCorrect: false },
    ],
  },
  {
    id: '5',
    word: 'mellifluous',
    pronunciation: '/məˈlɪfluəs/',
    partOfSpeech: 'adjective',
    definition: 'Sweetly sounding',
    example: "The singer's mellifluous voice captivated the audience",
    date: '2025-05-21', // May 21st
    options: [
      { value: 'Sweetly sounding', isCorrect: true },
      { value: 'Harsh and grating', isCorrect: false },
      { value: 'Filled with honey', isCorrect: false },
      { value: 'Fast flowing', isCorrect: false },
    ],
  },
  {
    id: '6',
    word: 'eloquent',
    pronunciation: '/ˈɛləkwənt/',
    partOfSpeech: 'adjective',
    definition: 'Fluent and persuasive',
    example: 'Her eloquent speech moved everyone to tears',
    date: '2025-05-20', // May 20th
    options: [
      { value: 'Fluent and persuasive', isCorrect: true },
      { value: 'Silent but expressive', isCorrect: false },
      { value: 'Excessively wordy', isCorrect: false },
      { value: 'Ancient language', isCorrect: false },
    ],
  },
  {
    id: '7',
    word: 'resilience',
    pronunciation: '/rɪˈzɪlɪəns/',
    partOfSpeech: 'noun',
    definition: 'Quick recovery ability',
    example: 'He showed remarkable resilience in the face of adversity',
    date: '2025-05-19', // May 19th
    options: [
      { value: 'Quick recovery ability', isCorrect: true },
      { value: 'Physical strength', isCorrect: false },
      { value: 'Mental stubbornness', isCorrect: false },
      { value: 'Temporary setback', isCorrect: false },
    ],
  },
  {
    id: '8',
    word: 'meticulous',
    pronunciation: '/məˈtɪkjʊləs/',
    partOfSpeech: 'adjective',
    definition: 'Extremely careful',
    example: 'His meticulous research uncovered new evidence',
    date: '2025-05-18', // May 18th
    options: [
      { value: 'Extremely careful', isCorrect: true },
      { value: 'Completely careless', isCorrect: false },
      { value: 'Quick and efficient', isCorrect: false },
      { value: 'Overly dramatic', isCorrect: false },
    ],
  },
  {
    id: '9',
    word: 'perspicacious',
    pronunciation: '/ˌpəːspɪˈkeɪʃəs/',
    partOfSpeech: 'adjective',
    definition: 'Insightful understanding',
    example: 'Her perspicacious comments revealed the truth of the situation',
    date: '2025-05-17', // May 17th
    options: [
      { value: 'Insightful understanding', isCorrect: true },
      { value: 'Suspicious nature', isCorrect: false },
      { value: 'Persistent questioning', isCorrect: false },
      { value: 'Clear visibility', isCorrect: false },
    ],
  },
  {
    id: '10',
    word: 'sycophant',
    pronunciation: '/ˈsɪkəfənt/',
    partOfSpeech: 'noun',
    definition: 'Servile flatterer',
    example:
      'The CEO was surrounded by sycophants who agreed with everything he said',
    date: '2025-05-16', // May 16th
    options: [
      { value: 'Servile flatterer', isCorrect: true },
      { value: 'Harsh critic', isCorrect: false },
      { value: 'Musical instrument', isCorrect: false },
      { value: 'Ancient physician', isCorrect: false },
    ],
  },
  {
    id: '11',
    word: 'cacophony',
    pronunciation: '/kəˈkɒfəni/',
    partOfSpeech: 'noun',
    definition: 'Harsh sound mixture',
    example: 'The cacophony of the busy market made conversation difficult',
    date: '2025-05-15', // May 15th
    options: [
      { value: 'Harsh sound mixture', isCorrect: true },
      { value: 'Perfect harmony', isCorrect: false },
      { value: 'Deep silence', isCorrect: false },
      { value: 'Speech impediment', isCorrect: false },
    ],
  },
  {
    id: '12',
    word: 'quintessential',
    pronunciation: '/ˌkwɪntɪˈsɛnʃ(ə)l/',
    partOfSpeech: 'adjective',
    definition: 'Perfect typical example',
    example:
      'The quintessential New York experience includes a walk through Central Park',
    date: '2025-05-14', // May 14th
    options: [
      { value: 'Perfect typical example', isCorrect: true },
      { value: 'Fifth in sequence', isCorrect: false },
      { value: 'Highly unusual', isCorrect: false },
      { value: 'Essentially questionable', isCorrect: false },
    ],
  },
  {
    id: '13',
    word: 'juxtaposition',
    pronunciation: '/ˌdʒʌkstəpəˈzɪʃ(ə)n/',
    partOfSpeech: 'noun',
    definition: 'Side-by-side contrast',
    example:
      'The juxtaposition of ancient and modern architecture created a unique cityscape',
    date: '2025-05-13', // May 13th
    options: [
      { value: 'Side-by-side contrast', isCorrect: true },
      { value: 'Legal positioning', isCorrect: false },
      { value: 'Overlapping elements', isCorrect: false },
      { value: 'Forceful opposition', isCorrect: false },
    ],
  },
  {
    id: '14',
    word: 'benevolent',
    pronunciation: '/bəˈnɛvələnt/',
    partOfSpeech: 'adjective',
    definition: 'Kind and generous',
    example: 'The benevolent donor gave generously to the charity',
    date: '2025-05-12', // May 12th
    options: [
      { value: 'Kind and generous', isCorrect: true },
      { value: 'Selfish and greedy', isCorrect: false },
      { value: 'Powerful and mighty', isCorrect: false },
      { value: 'Visible and apparent', isCorrect: false },
    ],
  },
  {
    id: '15',
    word: 'ubiquitous',
    pronunciation: '/juːˈbɪkwɪtəs/',
    partOfSpeech: 'adjective',
    definition: 'Present everywhere',
    example: 'Mobile phones are ubiquitous these days.',
    date: '2025-04-03',
    options: [
      { value: 'Present everywhere', isCorrect: true },
      { value: 'Rarely found', isCorrect: false },
      { value: 'Very large', isCorrect: false },
      { value: 'Secretive', isCorrect: false },
    ],
  },
  {
    id: '16',
    word: 'proclivity',
    pronunciation: '/proʊˈklɪvəti/',
    partOfSpeech: 'noun',
    definition: 'Natural tendency',
    example: 'He had a proclivity for exaggeration.',
    date: '2025-04-04',
    options: [
      { value: 'Natural tendency', isCorrect: true },
      { value: 'Strong dislike', isCorrect: false },
      { value: 'Sudden insight', isCorrect: false },
      { value: 'Learned skill', isCorrect: false },
    ],
  },
  {
    id: '17',
    word: 'gregarious',
    pronunciation: '/ɡrɪˈɡɛəriəs/',
    partOfSpeech: 'adjective',
    definition: 'Sociable, fond of company',
    example: 'She was a popular and gregarious teacher.',
    date: '2025-04-05',
    options: [
      { value: 'Sociable, fond of company', isCorrect: true },
      { value: 'Shy and reserved', isCorrect: false },
      { value: 'Angry and hostile', isCorrect: false },
      { value: 'Serious and studious', isCorrect: false },
    ],
  },
  {
    id: '18',
    word: 'epistolary',
    pronunciation: '/ɪˈpɪstələri/',
    partOfSpeech: 'adjective',
    definition: 'Relating to letters',
    example: 'The novel was written in an epistolary format.',
    date: '2025-04-06',
    options: [
      { value: 'Relating to letters', isCorrect: true },
      { value: 'About ancient history', isCorrect: false },
      { value: 'Containing many pictures', isCorrect: false },
      { value: 'Difficult to understand', isCorrect: false },
    ],
  },
  {
    id: '19',
    word: 'vicissitude',
    pronunciation: '/vɪˈsɪsɪtjuːd/',
    partOfSpeech: 'noun',
    definition: 'Change of circumstances',
    example: "They remained friends through all life's vicissitudes.",
    date: '2025-04-07',
    options: [
      { value: 'Change of circumstances', isCorrect: true },
      { value: 'Period of stability', isCorrect: false },
      { value: 'Feeling of great joy', isCorrect: false },
      { value: 'State of confusion', isCorrect: false },
    ],
  },
  {
    id: '20',
    word: 'pulchritudinous',
    pronunciation: '/ˌpʌlkrɪˈtjuːdɪnəs/',
    partOfSpeech: 'adjective',
    definition: 'Having great beauty',
    example: 'The pulchritudinous landscape captivated the visitors.',
    date: '2025-04-08',
    options: [
      { value: 'Having great beauty', isCorrect: true },
      { value: 'Extremely ugly', isCorrect: false },
      { value: 'Very noisy', isCorrect: false },
      { value: 'Old and decaying', isCorrect: false },
    ],
  },
  {
    id: '21',
    word: 'obfuscate',
    pronunciation: '/ˈɒbfəskeɪt/',
    partOfSpeech: 'verb',
    definition: 'Make unclear or obscure',
    example: 'The politician tried to obfuscate the issue.',
    date: '2025-04-09',
    options: [
      { value: 'Make unclear or obscure', isCorrect: true },
      { value: 'Explain clearly', isCorrect: false },
      { value: 'Highlight important points', isCorrect: false },
      { value: 'Simplify complexity', isCorrect: false },
    ],
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
      {
        value: `Related to ancient ${word.partOfSpeech === 'noun' ? 'rituals' : 'practices'}`,
        isCorrect: false,
      },
      {
        value: `Unusual ${word.partOfSpeech === 'noun' ? 'object' : 'quality'}`,
        isCorrect: false,
      },
    ];

    return {
      ...word,
      options,
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
