-- Add unique constraints for better data integrity

-- Make word column unique in words table
ALTER TABLE public.words
ADD CONSTRAINT words_word_key UNIQUE (word);

-- Add foreign key constraint from word_synsets to words
ALTER TABLE public.word_synsets
DROP CONSTRAINT IF EXISTS word_synsets_word_fkey,
ADD CONSTRAINT word_synsets_word_fkey FOREIGN KEY (word) REFERENCES words(word) ON DELETE CASCADE;

-- Add unique constraint for word-synset pairs
ALTER TABLE public.word_synsets
ADD CONSTRAINT word_synsets_word_synset_key UNIQUE (word, synset_id);

-- Add unique constraint for relationships
ALTER TABLE public.relationships
ADD CONSTRAINT relationships_unique_key UNIQUE (from_synset_id, to_synset_id, relationship_type); 