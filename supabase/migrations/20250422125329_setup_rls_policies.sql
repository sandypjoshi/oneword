-- ==== Row Level Security (RLS) Policies ====

-- Enable RLS for relevant tables
ALTER TABLE difficulty_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_progress ENABLE ROW LEVEL SECURITY;

-- --- Public Read Policies ---
CREATE POLICY "Allow read access to authenticated users on difficulty_levels" ON difficulty_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users on words" ON words FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users on word_definitions" ON word_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users on word_examples" ON word_examples FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users on daily_schedule" ON daily_schedule FOR SELECT TO authenticated USING (true);

-- --- Profiles Policies ---
CREATE POLICY "Allow individual user read access on profiles" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow individual user update access on profiles" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- --- User Word Progress Policies ---
CREATE POLICY "Allow individual user read access on user_word_progress" ON user_word_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow individual user insert access on user_word_progress" ON user_word_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow individual user update access on user_word_progress" ON user_word_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
