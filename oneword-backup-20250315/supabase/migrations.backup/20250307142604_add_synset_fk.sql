-- Add foreign key constraint from word_synsets to synsets
ALTER TABLE public.word_synsets
DROP CONSTRAINT IF EXISTS word_synsets_synset_id_fkey,
ADD CONSTRAINT word_synsets_synset_id_fkey FOREIGN KEY (synset_id) REFERENCES synsets(id) ON DELETE CASCADE; 