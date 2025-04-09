# OneWord App - Development Plan (Post-UI Refinement)

## Overall Goal
Build a vocabulary learning app (`OneWord`) using React Native (Expo) and Supabase, centered around a "Word of the Day" feature and reinforced by practice sessions using Spaced Repetition (SRS) and engaging streaks.

## Current State
- React Native frontend substantially built (UI, navigation, theming, animations for 'Today' tab).
- Frontend uses **mock data** exclusively.
- Recent UI refinements (fonts, `<Separator>` component, cleanup) complete.
- Detailed planning for Streaks and Practice features done.
- **BLOCKER:** New Supabase database setup is pending.

## Phase 1: Backend Infrastructure Setup (Immediate Priority / Blocker)

1.  **Create New Supabase Project:**
    *   **Action:** Use the [Supabase Dashboard](https://app.supabase.com/).
    *   **Steps:**
        *   Click "New project", select organization.
        *   Assign name (e.g., `oneword-prod`), generate/save secure DB password.
        *   Select region and pricing plan (free tier initially).
        *   Wait for provisioning.
    *   **Outcome:** New Supabase project URL and API keys obtained.
2.  **Setup Local Development Environment:**
    *   Install [Supabase CLI](https://supabase.com/docs/guides/cli).
    *   Login to Supabase: `supabase login`.
    *   Link local project to new Supabase project: `supabase link --project-ref YOUR_NEW_PROJECT_REF` (replace with actual ref).
    *   Initialize Supabase config if needed: `supabase init`.
3.  **Define Database Schema (Migration Scripts):**
    *   **Location:** `supabase/migrations/`
    *   **Process:** Use Supabase CLI to create migration files for schema changes.
    *   **Command:** `supabase migration new <migration_name>` (e.g., `create_initial_tables`, `setup_rls`).
    *   **Content (Example `..._create_initial_tables.sql`):**
        ```sql
        -- Define difficulty thresholds first due to FK constraint
        CREATE TABLE difficulty_thresholds (
            level TEXT PRIMARY KEY,
            min_score REAL NOT NULL,
            max_score REAL NOT NULL
        );

        CREATE TABLE app_words (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            word TEXT NOT NULL UNIQUE,
            definition TEXT,
            part_of_speech TEXT,
            example_sentence TEXT,
            difficulty_score REAL DEFAULT 0, -- Raw score from source
            difficulty_level TEXT REFERENCES difficulty_thresholds(level), -- Derived level
            lemma TEXT, -- Base form of the word
            phonetic_spelling TEXT, -- Optional: IPA or similar
            distractors TEXT[], -- Optional: For MCQ quizzes
            created_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE TABLE profiles (
            user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            username TEXT UNIQUE,
            streak_current INT DEFAULT 0,
            streak_longest INT DEFAULT 0,
            streak_last_date DATE, -- Use DATE type, handle timezone logic in functions
            difficulty_preference TEXT REFERENCES difficulty_thresholds(level),
            -- Add other settings like notification prefs, etc.
            updated_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE TABLE daily_word_schedule (
            scheduled_date DATE PRIMARY KEY,
            app_word_id UUID NOT NULL REFERENCES app_words(id),
            created_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE INDEX idx_daily_word_schedule_word_id ON daily_word_schedule(app_word_id);

        CREATE TABLE word_relations (
            id BIGSERIAL PRIMARY KEY,
            app_word_id UUID NOT NULL REFERENCES app_words(id),
            relation_type TEXT NOT NULL, -- 'synonym', 'antonym'
            related_word TEXT NOT NULL,
            source TEXT, -- e.g., 'Datamuse', 'Manual'
            created_at TIMESTAMPTZ DEFAULT now(),
            UNIQUE(app_word_id, relation_type, related_word) -- Prevent duplicates
        );
        CREATE INDEX idx_word_relations_app_word_id ON word_relations(app_word_id);


        CREATE TABLE user_word_progress (
            id BIGSERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            app_word_id UUID NOT NULL REFERENCES app_words(id) ON DELETE CASCADE,
            mastery_level INT DEFAULT 0, -- SRS level/bucket
            next_review_date TIMESTAMPTZ DEFAULT now(), -- When the word is due for review
            last_reviewed_at TIMESTAMPTZ,
            correct_streak INT DEFAULT 0, -- Consecutive correct answers for this word
            is_learned BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT now(),
            UNIQUE(user_id, app_word_id) -- One progress record per user per word
        );
        CREATE INDEX idx_user_word_progress_user_review_date ON user_word_progress(user_id, next_review_date);
        CREATE INDEX idx_user_word_progress_user_learned ON user_word_progress(user_id, is_learned);

        -- Add necessary indexes (examples shown above)
        ```
    *   **RLS Policies (Example in a separate migration `..._setup_rls.sql`):**
        ```sql
        -- Profiles RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view their own profile." ON profiles FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = user_id);

        -- User Word Progress RLS
        ALTER TABLE user_word_progress ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can manage their own word progress." ON user_word_progress FOR ALL USING (auth.uid() = user_id);

        -- Allow read access to public data (example)
        -- ALTER TABLE app_words ENABLE ROW LEVEL SECURITY;
        -- CREATE POLICY "Allow public read access to words." ON app_words FOR SELECT USING (true);
        -- CREATE POLICY "Allow public read access to thresholds." ON difficulty_thresholds FOR SELECT USING (true);
        -- CREATE POLICY "Allow public read access to schedule." ON daily_word_schedule FOR SELECT USING (true);
        ```
4.  **Apply Migrations:**
    *   **Local Testing (Recommended):** Start local Supabase: `supabase start`. Apply migrations locally: `supabase migration up` (or `supabase db push` for simpler sync). Test schema.
    *   **Remote Deployment:** Apply migrations to the hosted Supabase project: `supabase migration up`. Verify changes in the Supabase Dashboard (Table Editor, SQL Editor).

## Phase 2: Core Content & User Data Migration/Setup

1.  **Implement `app_words` Migration Script:**
    *   **Tooling:** Create a dedicated script (e.g., Node.js: `scripts/migrate_words.js` using `@supabase/supabase-js`; Python: `scripts/migrate_words.py` using `supabase-py`). Requires a lemmatization library (e.g., `natural` for Node, `nltk`/`spaCy` for Python).
    *   **Credentials:** Securely manage Supabase URL and `service_role` keys for *both* old (read) and new (write) projects (e.g., use `.env` file and `dotenv` library).
    *   **Logic:**
        1.  Initialize Supabase clients for old and new databases.
        2.  Fetch `difficulty_thresholds` from the **new** DB.
        3.  Fetch words in batches from the **old** DB's `app_words` table.
        4.  For each batch:
            *   Filter out unwanted words (profanity, common stop words).
            *   **Transform:**
                *   Handle `difficulty_score = 0` (assign 'Beginner', nominal score 0.01 or map to lowest threshold).
                *   Populate `lemma` using the chosen lemmatization library.
                *   Populate `difficulty_level` by comparing `difficulty_score` against fetched thresholds.
            *   Prepare data array matching the **new** `app_words` schema.
            *   Insert the batch into the **new** DB using the Supabase client (`.insert()`).
        5.  Implement robust logging and error handling (especially for insert conflicts or API errors).
    *   **Execution:** Run this script from a local or secure environment after the new schema is ready.
2.  **Populate Config Tables (`difficulty_thresholds`):**
    *   **Method:** Use a dedicated Supabase migration file (`supabase migration new seed_config_data`).
    *   **Content (Example `..._seed_config_data.sql`):**
        ```sql
        INSERT INTO difficulty_thresholds (level, min_score, max_score) VALUES
        ('Beginner', 0.0, 0.3),
        ('Intermediate', 0.3, 0.7),
        ('Advanced', 0.7, 1.0);
        -- Define more levels as needed
        ```
    *   **Apply:** Run `supabase migration up`. Alternatively, use the Supabase SQL Editor for simple seeding.
3.  **Schedule Initial Daily Words:**
    *   **Method:** Use a script or the SQL Editor to insert initial entries into `daily_word_schedule`. Requires selecting existing `app_word_id`s from the newly populated `app_words` table.
4.  **Frontend Connection (Basic):**
    - Configure Supabase client (`@supabase/supabase-js`) in the app.
    - Update data service layer to fetch real data (Word of Day, basic profile).
    - Implement basic loading/error states for data fetching.

## Phase 3: Feature Implementation - Streaks & Practice (MVP)

1.  **Streak Feature (MVP):**
    *   **Backend (Edge Function `update-streak`):**
        - Input: `user_id`.
        - Logic: Use **UTC dates** for simplicity. Check `profiles.streak_last_date`, increment/reset `streak_current`, update `streak_longest`, update `streak_last_date`.
        - Output: Updated streak info (optional).
    *   **Client:**
        - Trigger: Call `update-streak` function after successful view of *current* daily word answer/reflection.
        - Display: Fetch `streak_current` from profile, update `StreakIndicator`. Remove mock store dependency.
        - Feedback: Simple "pop" animation on `StreakIndicator` on successful update.
2.  **Practice Feature (SRS - MVP):**
    *   **Backend (Edge Function `update-srs`):**
        - Input: `user_id`, `app_word_id`, `is_correct`.
        - Logic: Implement basic SRS interval adjustment (e.g., reset on incorrect, increase on correct). Update `user_word_progress` (`next_review_date`, `mastery_level`, `last_reviewed_at`, `correct_streak`).
    *   **Client:**
        - **Seeding:** On profile creation, add 5-10 random words from `app_words` matching `difficulty_preference` to `user_word_progress`.
        - **Add Daily Words:** Add viewed daily words to `user_word_progress`.
        - **Session Logic:** Fetch reviewable words (`next_review_date` <= now) from `user_word_progress`.
        - **Quiz UI (MVP - 2 Types):**
            - Definition Recall (MCQ using `distractors`).
            - Rapid Review (Flashcard + Self-Grade).
        - **Interaction:** Call `update-srs` function based on quiz answer/self-grade.
3.  **Related Words (Combined Strategy):**
    *   **Backend (Pre-fetch Job):**
        - Supabase Cron Job + Edge Function.
        - Runs daily, looks ahead in `daily_word_schedule`.
        - Fetches synonyms/antonyms from Datamuse API for upcoming daily words *if not already in `word_relations`*.
        - Stores results in `word_relations`.
        - Implement robust error handling for API calls and DB writes.
    *   **Client:**
        - UI: Section/button to view related words.
        - Logic:
            - If viewing daily word: Query `word_relations` from Supabase. Display instantly.
            - If viewing practice/other word: Call Datamuse API directly. Display with clear loading/error states.

## Phase 4: Enhancements & Long-Term

1.  **Expand Practice:** Add more quiz types, mastery visualization, practice streaks, points/XP, targeted practice mode, optional "Learn New Words" mode.
2.  **Enhance Streaks:** Implement milestones, streak freezes, timezone options (if desired), notifications.
3.  **Testing:** Implement comprehensive unit, component, and integration tests.
4.  **Refactoring:** Address large/complex components. Consolidate project structure (`lib`/`src`).
5.  **UI/UX:** Standardize loading/error states, improve animations, add Skia effects (noise texture).
6.  **Other Features:** Profile tab, search/history, etc.
7.  **Monitoring:** Track `user_word_progress` table size, background job performance, API usage.

## Key Dependencies & Risks
- **Supabase DB Setup:** Current primary blocker.
- **Migration Script:** Complexity requires careful implementation and testing.
- **`user_word_progress` Scaling:** Potential long-term size issue; requires monitoring.
- **External APIs (Datamuse):** Availability, rate limits, potential changes.
- **Background Job:** Reliability and monitoring. 