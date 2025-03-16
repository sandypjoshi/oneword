/**
 * Better Examples of Word Definitions and Distractors
 * This file provides improved examples of definitions and distractors for words
 * that were identified as having quality issues.
 */

// TROUBLE (noun)
const troubleImproved = {
  word: "trouble",
  pos: "noun",
  short_definition: "A situation causing distress, worry, or difficulty",
  owad_phrase: [
    "a serious problem",
    "a worrying situation"
  ],
  distractors: [
    {
      type: "distinct semantic category",
      distractor: "disaster" // A much more severe event
    },
    {
      type: "phonological similarity",
      distractor: "rubble" // Sounds similar but means destroyed building materials
    },
    {
      type: "related function",
      distractor: "conflict" // Involves active opposition rather than a problematic situation
    },
    {
      type: "opposite concept",
      distractor: "solution" // The resolution to trouble, not trouble itself
    },
    {
      type: "commonly confused context",
      distractor: "effort" // Something requiring work but not necessarily problematic
    }
  ]
};

// MEDIUM (noun)
const mediumImproved = {
  word: "medium",
  pos: "noun",
  short_definition: "A means or channel for communication or expression",
  owad_phrase: [
    "a way to communicate",
    "an information channel"
  ],
  distractors: [
    {
      type: "distinct semantic category",
      distractor: "message" // The content being communicated, not the channel
    },
    {
      type: "phonological similarity",
      distractor: "median" // Sounds similar but refers to statistical middle value
    },
    {
      type: "related but distinct concept",
      distractor: "platform" // A foundation or base rather than a communication channel
    },
    {
      type: "size-related confusion",
      distractor: "average" // Related to middle size but not a communication channel
    },
    {
      type: "commonly confused term",
      distractor: "forum" // A venue for discussion, not the means of communication itself
    }
  ]
};

// Examples of other improved words that could be processed
const otherImprovements = [
  {
    word: "calculate",
    pos: "verb",
    short_definition: "To determine mathematically the amount or number of something",
    owad_phrase: [
      "to figure out numbers",
      "to compute a result"
    ],
    distractors: [
      {
        type: "distinct semantic category",
        distractor: "speculate" // Making guesses rather than mathematical determination
      },
      {
        type: "phonological similarity",
        distractor: "calibrate" // Sounds similar but means to adjust or standardize
      },
      {
        type: "related but distinct process",
        distractor: "contemplate" // Mental consideration without mathematical computation
      },
      {
        type: "common misuse",
        distractor: "estimate" // Approximate judgment rather than precise calculation
      },
      {
        type: "commonly confused function",
        distractor: "formulate" // Creating rather than computing
      }
    ]
  },
  {
    word: "precise",
    pos: "adjective",
    short_definition: "Exactly defined, accurate, and without vagueness or ambiguity",
    owad_phrase: [
      "completely exact",
      "perfectly accurate"
    ],
    distractors: [
      {
        type: "distinct semantic category",
        distractor: "detailed" // Having many parts or elements rather than exactness
      },
      {
        type: "phonological similarity",
        distractor: "prized" // Sounds similar but means valued highly
      },
      {
        type: "related but distinct quality",
        distractor: "concise" // Brief and compact rather than exact
      },
      {
        type: "opposite concept",
        distractor: "ambiguous" // Unclear or open to interpretation
      },
      {
        type: "commonly confused attribute",
        distractor: "complex" // Complicated rather than exact
      }
    ]
  }
];

// Export the improved examples
module.exports = {
  troubleImproved,
  mediumImproved,
  otherImprovements
}; 