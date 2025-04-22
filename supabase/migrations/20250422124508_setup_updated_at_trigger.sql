-- ==== Functions & Triggers ====

-- Function to update 'updated_at' column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables
CREATE TRIGGER update_difficulty_levels_updated_at BEFORE UPDATE ON difficulty_levels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_words_updated_at BEFORE UPDATE ON words FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_word_definitions_updated_at BEFORE UPDATE ON word_definitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_word_examples_updated_at BEFORE UPDATE ON word_examples FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_schedule_updated_at BEFORE UPDATE ON daily_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_word_progress_updated_at BEFORE UPDATE ON user_word_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
