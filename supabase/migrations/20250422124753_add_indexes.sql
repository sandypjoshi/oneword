-- ==== Indexes ====

CREATE INDEX idx_words_word ON words(word);
CREATE INDEX idx_words_lemma ON words(lemma); -- Index added for lemma lookup
CREATE INDEX idx_words_difficulty_level ON words(difficulty_level);
CREATE INDEX idx_word_definitions_word_id ON word_definitions(word_id);
CREATE INDEX idx_word_examples_word_definition_id ON word_examples(word_definition_id);
CREATE INDEX idx_daily_schedule_word_id ON daily_schedule(word_id);
CREATE INDEX idx_user_word_progress_user_status ON user_word_progress(user_id, status);
