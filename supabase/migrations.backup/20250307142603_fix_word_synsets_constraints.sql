-- Fix word_synsets table constraints
BEGIN;

-- First, ensure words table has proper constraints
ALTER TABLE public.words
DROP CONSTRAINT IF EXISTS words_word_key,
ADD CONSTRAINT words_word_key UNIQUE (word);

-- Drop existing constraints on word_synsets
ALTER TABLE public.word_synsets
DROP CONSTRAINT IF EXISTS word_synsets_word_fkey,
DROP CONSTRAINT IF EXISTS word_synsets_synset_id_fkey;

-- Add proper foreign key constraints
ALTER TABLE public.word_synsets
ADD CONSTRAINT word_synsets_word_fkey 
  FOREIGN KEY (word) REFERENCES words(word) ON DELETE CASCADE,
ADD CONSTRAINT word_synsets_synset_id_fkey 
  FOREIGN KEY (synset_id) REFERENCES synsets(id) ON DELETE CASCADE;

-- Ensure unique constraint exists
ALTER TABLE public.word_synsets
DROP CONSTRAINT IF EXISTS word_synsets_word_synset_id_key,
ADD CONSTRAINT word_synsets_word_synset_id_key UNIQUE (word, synset_id);

COMMIT; 