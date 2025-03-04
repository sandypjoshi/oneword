

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."add_word_for_next_day"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  latest_date DATE;
  next_date DATE;
  edge_function_url TEXT := 'https://ipljgsggnbdwaomjfuok.supabase.co/functions/v1/addWordForNextDay';
  service_role_key TEXT := current_setting('app.supabase_service_role_key', TRUE);
  result JSONB;
BEGIN
  -- Find the latest date in the daily_words table
  SELECT MAX(date) INTO latest_date FROM daily_words;
  
  -- Calculate the next date
  next_date := latest_date + INTERVAL '1 day';
  
  -- Call the Edge Function to add words for the next day
  SELECT content::JSONB INTO result FROM 
  http((
    'POST',
    edge_function_url,
    ARRAY[
      http_header('Authorization', 'Bearer ' || service_role_key),
      http_header('Content-Type', 'application/json')
    ],
    jsonb_build_object(
      'date', next_date::TEXT
    )::TEXT,
    NULL
  ));
  
  -- Log the result
  RAISE NOTICE 'Edge Function Result: %', result;
END;
$$;


ALTER FUNCTION "public"."add_word_for_next_day"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_distractors_for_word"("word_text" "text", "pos" "text", "difficulty" "text", "limit_count" integer DEFAULT 5) RETURNS TABLE("distractor" "text", "quality_score" double precision)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT wd.distractor, wd.quality_score
  FROM word_distractors wd
  WHERE wd.word = word_text
    AND (wd.part_of_speech = pos OR pos IS NULL)
    AND wd.difficulty = difficulty
  ORDER BY wd.quality_score DESC, wd.usage_count ASC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_distractors_for_word"("word_text" "text", "pos" "text", "difficulty" "text", "limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_general_distractors_by_pos"("pos" "text", "difficulty" "text", "limit_count" integer DEFAULT 5) RETURNS TABLE("distractor" "text", "quality_score" double precision)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT wd.distractor, AVG(wd.quality_score) AS avg_quality_score
  FROM word_distractors wd
  WHERE wd.part_of_speech = pos
    AND wd.difficulty = difficulty
  GROUP BY wd.distractor
  ORDER BY avg_quality_score DESC, AVG(wd.usage_count) ASC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_general_distractors_by_pos"("pos" "text", "difficulty" "text", "limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment"("inc" integer) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$ 
BEGIN 
  RETURN inc + 1; 
END; 
$$;


ALTER FUNCTION "public"."increment"("inc" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment"("table_name" "text", "column_name" "text", "row_id" "uuid", "increment_by" integer DEFAULT 1) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  EXECUTE format('UPDATE %I SET %I = %I + $1 WHERE id = $2', table_name, column_name, column_name)
  USING increment_by, row_id;
END;
$_$;


ALTER FUNCTION "public"."increment"("table_name" "text", "column_name" "text", "row_id" "uuid", "increment_by" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_words_for_date_range"("start_date" "date", "end_date" "date") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  edge_function_url TEXT := 'https://ipljgsggnbdwaomjfuok.supabase.co/functions/v1/seedWordsForDateRange';
  service_role_key TEXT := current_setting('app.supabase_service_role_key', TRUE);
  result JSONB;
BEGIN
  -- Call the Edge Function with the date range
  SELECT content::JSONB INTO result FROM 
  http((
    'POST',
    edge_function_url,
    ARRAY[
      http_header('Authorization', 'Bearer ' || service_role_key),
      http_header('Content-Type', 'application/json')
    ],
    jsonb_build_object(
      'startDate', start_date::TEXT,
      'endDate', end_date::TEXT
    )::TEXT,
    NULL
  ));
  
  -- Log the result
  RAISE NOTICE 'Edge Function Result: %', result;
END;
$$;


ALTER FUNCTION "public"."seed_words_for_date_range"("start_date" "date", "end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."text_similarity"("text1" "text", "text2" "text") RETURNS double precision
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  common_words INTEGER := 0;
  words1 TEXT[];
  words2 TEXT[];
  total_words INTEGER;
BEGIN
  -- Convert to lowercase and split into words
  words1 := regexp_split_to_array(lower(text1), '\W+');
  words2 := regexp_split_to_array(lower(text2), '\W+');
  
  -- Count words that appear in both texts (simple implementation)
  SELECT COUNT(*)
  FROM unnest(words1) AS w1
  WHERE w1 IN (SELECT unnest(words2)) AND length(w1) > 3
  INTO common_words;
  
  -- Get total number of unique words
  total_words := array_length(array_cat(words1, words2), 1);
  
  -- Return similarity score
  RETURN common_words::FLOAT / GREATEST(1, total_words::FLOAT);
END;
$$;


ALTER FUNCTION "public"."text_similarity"("text1" "text", "text2" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_success_count"("table_name" "text", "row_id" "uuid", "was_successful" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  IF was_successful THEN
    EXECUTE format('UPDATE %I SET success_count = success_count + 1 WHERE id = $1', table_name)
    USING row_id;
  END IF;
  
  EXECUTE format('UPDATE %I SET impression_count = impression_count + 1 WHERE id = $1', table_name)
  USING row_id;
END;
$_$;


ALTER FUNCTION "public"."update_success_count"("table_name" "text", "row_id" "uuid", "was_successful" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."word_exists"("word_text" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM words WHERE word = word_text);
END;
$$;


ALTER FUNCTION "public"."word_exists"("word_text" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_cache" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "word" "text" NOT NULL,
    "api_name" "text" NOT NULL,
    "endpoint" "text" DEFAULT ''::"text",
    "params" "jsonb" DEFAULT '{}'::"jsonb",
    "response_data" "jsonb" NOT NULL,
    "response_status" integer,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    "hit_count" integer DEFAULT 1,
    "error_count" integer DEFAULT 0,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."api_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_words" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "word_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "difficulty" "text" NOT NULL,
    "options" "jsonb"[] NOT NULL,
    "correct_option_index" integer NOT NULL,
    "hint" "text",
    "explanation" "text",
    "impression_count" integer DEFAULT 0,
    "success_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_words" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."twinword_associations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "word" "text" NOT NULL,
    "associated_words" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."twinword_associations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "device_id" "text" NOT NULL,
    "daily_word_id" "uuid" NOT NULL,
    "correct" boolean DEFAULT false NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "time_spent" integer,
    "favorited" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."word_distractors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "word" "text" NOT NULL,
    "correct_definition" "jsonb" NOT NULL,
    "distractor" "text" NOT NULL,
    "part_of_speech" "text" NOT NULL,
    "difficulty" "text" NOT NULL,
    "source" "text" NOT NULL,
    "source_word" "text",
    "semantic_similarity" double precision DEFAULT 0.0,
    "quality_score" double precision DEFAULT 0.0,
    "usage_count" integer DEFAULT 0,
    "success_count" integer DEFAULT 0,
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."word_distractors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."word_relationships" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "source_word" "text" NOT NULL,
    "related_word" "text" NOT NULL,
    "relationship_type" "text" NOT NULL,
    "relationship_strength" double precision DEFAULT 0.0,
    "source" "text" NOT NULL,
    "bidirectional" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."word_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."words" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "word" "text" NOT NULL,
    "pronunciation" "text",
    "part_of_speech" "text",
    "definitions" "jsonb"[] NOT NULL,
    "examples" "text"[],
    "synonyms" "text"[],
    "antonyms" "text"[],
    "difficulty_score" double precision DEFAULT 0.0,
    "frequency_score" double precision DEFAULT 0.0,
    "syllable_count" integer,
    "definition_count" integer GENERATED ALWAYS AS ("array_length"("definitions", 1)) STORED,
    "has_examples" boolean GENERATED ALWAYS AS (("array_length"("examples", 1) > 0)) STORED,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."words" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_cache"
    ADD CONSTRAINT "api_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_words"
    ADD CONSTRAINT "daily_words_date_difficulty_key" UNIQUE ("date", "difficulty");



ALTER TABLE ONLY "public"."daily_words"
    ADD CONSTRAINT "daily_words_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."twinword_associations"
    ADD CONSTRAINT "twinword_associations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."twinword_associations"
    ADD CONSTRAINT "twinword_associations_word_key" UNIQUE ("word");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_device_daily_word_idx" UNIQUE ("device_id", "daily_word_id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."word_distractors"
    ADD CONSTRAINT "word_distractors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."word_distractors"
    ADD CONSTRAINT "word_distractors_word_distractor_key" UNIQUE ("word", "distractor");



ALTER TABLE ONLY "public"."word_relationships"
    ADD CONSTRAINT "word_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."word_relationships"
    ADD CONSTRAINT "word_relationships_source_word_related_word_relationship_ty_key" UNIQUE ("source_word", "related_word", "relationship_type");



ALTER TABLE ONLY "public"."words"
    ADD CONSTRAINT "words_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."words"
    ADD CONSTRAINT "words_word_key" UNIQUE ("word");



CREATE INDEX "idx_api_cache_expiry" ON "public"."api_cache" USING "btree" ("expires_at");



CREATE UNIQUE INDEX "idx_api_cache_unique" ON "public"."api_cache" USING "btree" ("word", "api_name", COALESCE("endpoint", ''::"text"));



CREATE INDEX "idx_daily_words_date" ON "public"."daily_words" USING "btree" ("date");



CREATE INDEX "idx_daily_words_word_difficulty" ON "public"."daily_words" USING "btree" ("word_id", "difficulty");



CREATE INDEX "idx_twinword_associations_word" ON "public"."twinword_associations" USING "btree" ("word");



CREATE INDEX "idx_word_distractors_quality" ON "public"."word_distractors" USING "btree" ("quality_score" DESC);



CREATE INDEX "idx_word_distractors_word" ON "public"."word_distractors" USING "btree" ("word");



CREATE INDEX "idx_word_relationships_related" ON "public"."word_relationships" USING "btree" ("related_word");



CREATE INDEX "idx_word_relationships_source" ON "public"."word_relationships" USING "btree" ("source_word");



CREATE INDEX "idx_words_difficulty" ON "public"."words" USING "btree" ("difficulty_score", "frequency_score");



CREATE INDEX "idx_words_word" ON "public"."words" USING "btree" ("word");



CREATE INDEX "user_progress_device_id_idx" ON "public"."user_progress" USING "btree" ("device_id");



CREATE INDEX "user_progress_favorited_idx" ON "public"."user_progress" USING "btree" ("favorited");



CREATE OR REPLACE TRIGGER "update_api_cache_modtime" BEFORE UPDATE ON "public"."api_cache" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_daily_words_modtime" BEFORE UPDATE ON "public"."daily_words" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_word_distractors_modtime" BEFORE UPDATE ON "public"."word_distractors" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_words_modtime" BEFORE UPDATE ON "public"."words" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



ALTER TABLE ONLY "public"."daily_words"
    ADD CONSTRAINT "daily_words_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id");



CREATE POLICY "Enable insert/update for service role only" ON "public"."twinword_associations" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."twinword_associations" FOR SELECT USING (true);



CREATE POLICY "Users can only insert their own progress" ON "public"."user_progress" FOR INSERT WITH CHECK (("device_id" = "current_setting"('request.headers.x-device-id'::"text", true)));



CREATE POLICY "Users can only read their own progress" ON "public"."user_progress" FOR SELECT USING (("device_id" = "current_setting"('request.headers.x-device-id'::"text", true)));



CREATE POLICY "Users can only update their own progress" ON "public"."user_progress" FOR UPDATE USING (("device_id" = "current_setting"('request.headers.x-device-id'::"text", true)));



ALTER TABLE "public"."api_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "api_cache_service_policy" ON "public"."api_cache" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."daily_words" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_words_insert_policy" ON "public"."daily_words" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "daily_words_read_policy" ON "public"."daily_words" FOR SELECT USING (true);



ALTER TABLE "public"."twinword_associations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."word_distractors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "word_distractors_service_policy" ON "public"."word_distractors" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."word_relationships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "word_relationships_service_policy" ON "public"."word_relationships" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."words" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "words_insert_policy" ON "public"."words" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "words_read_policy" ON "public"."words" FOR SELECT USING (true);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_word_for_next_day"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_word_for_next_day"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_word_for_next_day"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_distractors_for_word"("word_text" "text", "pos" "text", "difficulty" "text", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_distractors_for_word"("word_text" "text", "pos" "text", "difficulty" "text", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_distractors_for_word"("word_text" "text", "pos" "text", "difficulty" "text", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_general_distractors_by_pos"("pos" "text", "difficulty" "text", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_general_distractors_by_pos"("pos" "text", "difficulty" "text", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_general_distractors_by_pos"("pos" "text", "difficulty" "text", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment"("inc" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment"("inc" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment"("inc" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment"("table_name" "text", "column_name" "text", "row_id" "uuid", "increment_by" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment"("table_name" "text", "column_name" "text", "row_id" "uuid", "increment_by" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment"("table_name" "text", "column_name" "text", "row_id" "uuid", "increment_by" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_words_for_date_range"("start_date" "date", "end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."seed_words_for_date_range"("start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_words_for_date_range"("start_date" "date", "end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."text_similarity"("text1" "text", "text2" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."text_similarity"("text1" "text", "text2" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."text_similarity"("text1" "text", "text2" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_success_count"("table_name" "text", "row_id" "uuid", "was_successful" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_success_count"("table_name" "text", "row_id" "uuid", "was_successful" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_success_count"("table_name" "text", "row_id" "uuid", "was_successful" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."word_exists"("word_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_exists"("word_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_exists"("word_text" "text") TO "service_role";



GRANT ALL ON TABLE "public"."api_cache" TO "anon";
GRANT ALL ON TABLE "public"."api_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."api_cache" TO "service_role";



GRANT ALL ON TABLE "public"."daily_words" TO "anon";
GRANT ALL ON TABLE "public"."daily_words" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_words" TO "service_role";



GRANT ALL ON TABLE "public"."twinword_associations" TO "anon";
GRANT ALL ON TABLE "public"."twinword_associations" TO "authenticated";
GRANT ALL ON TABLE "public"."twinword_associations" TO "service_role";



GRANT ALL ON TABLE "public"."user_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_progress" TO "service_role";



GRANT ALL ON TABLE "public"."word_distractors" TO "anon";
GRANT ALL ON TABLE "public"."word_distractors" TO "authenticated";
GRANT ALL ON TABLE "public"."word_distractors" TO "service_role";



GRANT ALL ON TABLE "public"."word_relationships" TO "anon";
GRANT ALL ON TABLE "public"."word_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."word_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."words" TO "anon";
GRANT ALL ON TABLE "public"."words" TO "authenticated";
GRANT ALL ON TABLE "public"."words" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
