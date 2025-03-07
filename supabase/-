

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



CREATE OR REPLACE FUNCTION "public"."get_daily_words"("target_date" "date") RETURNS TABLE("word" "text", "difficulty_level" "text", "definition" "text", "pos" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.word,
        dw.difficulty_level,
        s.definition,
        w.pos
    FROM 
        public.daily_words dw
    JOIN 
        public.words w ON dw.word = w.word
    JOIN 
        public.word_synsets ws ON w.word = ws.word
    JOIN 
        public.synsets s ON ws.synset_id = s.id
    WHERE 
        dw.date = target_date
    AND 
        ws.sense_number = 1;  -- Get primary sense
END;
$$;


ALTER FUNCTION "public"."get_daily_words"("target_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."word_exists"("word_to_check" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.words WHERE word = word_to_check);
END;
$$;


ALTER FUNCTION "public"."word_exists"("word_to_check" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."synsets" (
    "id" "text" NOT NULL,
    "definition" "text" NOT NULL,
    "pos" "text" NOT NULL,
    "domain" "text",
    "gloss" "text",
    "lexical_file_num" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."synsets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."word_metadata" (
    "word" "text" NOT NULL,
    "pronunciation" "text",
    "etymology" "text",
    "frequency" double precision,
    "frame_ids" "text"[],
    "usage_domain" "text"[],
    "register" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."word_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."word_synsets" (
    "id" integer NOT NULL,
    "word" "text" NOT NULL,
    "synset_id" "text" NOT NULL,
    "sense_number" integer,
    "tag_count" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."word_synsets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."words" (
    "id" integer NOT NULL,
    "word" "text" NOT NULL,
    "pos" "text",
    "polysemy" integer,
    "syllables" integer,
    "difficulty_score" double precision,
    "difficulty_level" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."words" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."complete_word_view" AS
 SELECT "w"."word",
    "w"."pos",
    "w"."difficulty_level",
    "w"."difficulty_score",
    "w"."polysemy",
    "w"."syllables",
    "s"."definition",
    "s"."domain",
    "s"."gloss",
    "ws"."sense_number",
    "ws"."tag_count",
    "m"."pronunciation",
    "m"."etymology",
    "m"."frequency"
   FROM ((("public"."words" "w"
     JOIN "public"."word_synsets" "ws" ON (("w"."word" = "ws"."word")))
     JOIN "public"."synsets" "s" ON (("ws"."synset_id" = "s"."id")))
     LEFT JOIN "public"."word_metadata" "m" ON (("w"."word" = "m"."word")))
  ORDER BY "w"."word", "ws"."sense_number";


ALTER TABLE "public"."complete_word_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_words" (
    "id" integer NOT NULL,
    "date" "date" NOT NULL,
    "word" "text" NOT NULL,
    "difficulty_level" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_words" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."daily_word_details" AS
 SELECT "dw"."date",
    "dw"."difficulty_level",
    "w"."word",
    "w"."difficulty_score",
    "w"."pos",
    "w"."polysemy"
   FROM ("public"."daily_words" "dw"
     JOIN "public"."words" "w" ON (("dw"."word" = "w"."word")));


ALTER TABLE "public"."daily_word_details" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."daily_words_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."daily_words_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."daily_words_id_seq" OWNED BY "public"."daily_words"."id";



CREATE TABLE IF NOT EXISTS "public"."distractors" (
    "id" integer NOT NULL,
    "word" "text" NOT NULL,
    "distractor" "text" NOT NULL,
    "distractor_type" "text" NOT NULL,
    "source" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."distractors" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."distractors_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."distractors_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."distractors_id_seq" OWNED BY "public"."distractors"."id";



CREATE TABLE IF NOT EXISTS "public"."domains" (
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."relationships" (
    "id" integer NOT NULL,
    "from_synset_id" "text" NOT NULL,
    "to_synset_id" "text" NOT NULL,
    "relationship_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."relationships" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."relationships_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."relationships_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."relationships_id_seq" OWNED BY "public"."relationships"."id";



CREATE OR REPLACE VIEW "public"."word_antonyms" AS
 SELECT "w1"."word",
    "w3"."word" AS "antonym",
    "s1"."definition" AS "word_definition",
    "s2"."definition" AS "antonym_definition"
   FROM (((("public"."word_synsets" "w1"
     JOIN "public"."synsets" "s1" ON (("w1"."synset_id" = "s1"."id")))
     JOIN "public"."relationships" "r" ON ((("w1"."synset_id" = "r"."from_synset_id") AND ("r"."relationship_type" = 'antonym'::"text"))))
     JOIN "public"."synsets" "s2" ON (("r"."to_synset_id" = "s2"."id")))
     JOIN "public"."word_synsets" "w3" ON (("w3"."synset_id" = "r"."to_synset_id")));


ALTER TABLE "public"."word_antonyms" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."word_definitions" AS
 SELECT "w"."word",
    "w"."difficulty_level",
    "s"."id" AS "synset_id",
    "s"."definition",
    "s"."pos",
    "s"."domain",
    "ws"."sense_number"
   FROM (("public"."words" "w"
     JOIN "public"."word_synsets" "ws" ON (("w"."word" = "ws"."word")))
     JOIN "public"."synsets" "s" ON (("ws"."synset_id" = "s"."id")))
  ORDER BY "ws"."sense_number";


ALTER TABLE "public"."word_definitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."word_examples" (
    "id" integer NOT NULL,
    "word" "text" NOT NULL,
    "synset_id" "text" NOT NULL,
    "example" "text" NOT NULL,
    "source" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."word_examples" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."word_examples_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."word_examples_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."word_examples_id_seq" OWNED BY "public"."word_examples"."id";



CREATE OR REPLACE VIEW "public"."word_hypernyms" AS
 SELECT "w1"."word",
    "w2"."word" AS "hypernym",
    "s1"."definition" AS "word_definition",
    "s2"."definition" AS "hypernym_definition"
   FROM (((("public"."word_synsets" "w1"
     JOIN "public"."synsets" "s1" ON (("w1"."synset_id" = "s1"."id")))
     JOIN "public"."relationships" "r" ON ((("w1"."synset_id" = "r"."from_synset_id") AND ("r"."relationship_type" = 'hypernym'::"text"))))
     JOIN "public"."synsets" "s2" ON (("r"."to_synset_id" = "s2"."id")))
     JOIN "public"."word_synsets" "w2" ON (("w2"."synset_id" = "r"."to_synset_id")));


ALTER TABLE "public"."word_hypernyms" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."word_hyponyms" AS
 SELECT "w1"."word",
    "w2"."word" AS "hyponym",
    "s1"."definition" AS "word_definition",
    "s2"."definition" AS "hyponym_definition"
   FROM (((("public"."word_synsets" "w1"
     JOIN "public"."synsets" "s1" ON (("w1"."synset_id" = "s1"."id")))
     JOIN "public"."relationships" "r" ON ((("w1"."synset_id" = "r"."from_synset_id") AND ("r"."relationship_type" = 'hyponym'::"text"))))
     JOIN "public"."synsets" "s2" ON (("r"."to_synset_id" = "s2"."id")))
     JOIN "public"."word_synsets" "w2" ON (("w2"."synset_id" = "r"."to_synset_id")));


ALTER TABLE "public"."word_hyponyms" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."word_synonyms" AS
 SELECT "w1"."word",
    "w2"."word" AS "synonym",
    "s"."definition",
    "s"."pos"
   FROM (("public"."word_synsets" "w1"
     JOIN "public"."word_synsets" "w2" ON ((("w1"."synset_id" = "w2"."synset_id") AND ("w1"."word" <> "w2"."word"))))
     JOIN "public"."synsets" "s" ON (("w1"."synset_id" = "s"."id")));


ALTER TABLE "public"."word_synonyms" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."word_synsets_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."word_synsets_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."word_synsets_id_seq" OWNED BY "public"."word_synsets"."id";



CREATE OR REPLACE VIEW "public"."word_with_examples" AS
 SELECT "w"."word",
    "s"."definition",
    "e"."example"
   FROM ((("public"."words" "w"
     JOIN "public"."word_synsets" "ws" ON (("w"."word" = "ws"."word")))
     JOIN "public"."synsets" "s" ON (("ws"."synset_id" = "s"."id")))
     LEFT JOIN "public"."word_examples" "e" ON ((("w"."word" = "e"."word") AND ("ws"."synset_id" = "e"."synset_id"))));


ALTER TABLE "public"."word_with_examples" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."words_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."words_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."words_id_seq" OWNED BY "public"."words"."id";



ALTER TABLE ONLY "public"."daily_words" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."daily_words_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."distractors" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."distractors_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."relationships" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."relationships_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."word_examples" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."word_examples_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."word_synsets" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."word_synsets_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."words" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."words_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."daily_words"
    ADD CONSTRAINT "daily_words_date_difficulty_level_key" UNIQUE ("date", "difficulty_level");



ALTER TABLE ONLY "public"."daily_words"
    ADD CONSTRAINT "daily_words_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."distractors"
    ADD CONSTRAINT "distractors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."domains"
    ADD CONSTRAINT "domains_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."synsets"
    ADD CONSTRAINT "synsets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."word_examples"
    ADD CONSTRAINT "word_examples_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."word_metadata"
    ADD CONSTRAINT "word_metadata_pkey" PRIMARY KEY ("word");



ALTER TABLE ONLY "public"."word_synsets"
    ADD CONSTRAINT "word_synsets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."word_synsets"
    ADD CONSTRAINT "word_synsets_word_synset_id_key" UNIQUE ("word", "synset_id");



ALTER TABLE ONLY "public"."words"
    ADD CONSTRAINT "words_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."words"
    ADD CONSTRAINT "words_word_key" UNIQUE ("word");



CREATE INDEX "idx_daily_words_date" ON "public"."daily_words" USING "btree" ("date");



CREATE INDEX "idx_daily_words_date_diff" ON "public"."daily_words" USING "btree" ("date", "difficulty_level");



CREATE INDEX "idx_daily_words_difficulty" ON "public"."daily_words" USING "btree" ("difficulty_level");



CREATE INDEX "idx_distractors_combined" ON "public"."distractors" USING "btree" ("word", "distractor_type");



CREATE INDEX "idx_distractors_type" ON "public"."distractors" USING "btree" ("distractor_type");



CREATE INDEX "idx_distractors_word" ON "public"."distractors" USING "btree" ("word");



CREATE INDEX "idx_relationships_combined" ON "public"."relationships" USING "btree" ("from_synset_id", "relationship_type");



CREATE INDEX "idx_relationships_from_synset_id" ON "public"."relationships" USING "btree" ("from_synset_id");



CREATE INDEX "idx_relationships_to_synset_id" ON "public"."relationships" USING "btree" ("to_synset_id");



CREATE INDEX "idx_relationships_type" ON "public"."relationships" USING "btree" ("relationship_type");



CREATE INDEX "idx_synsets_domain" ON "public"."synsets" USING "btree" ("domain");



CREATE INDEX "idx_synsets_lexical_file" ON "public"."synsets" USING "btree" ("lexical_file_num");



CREATE INDEX "idx_synsets_pos" ON "public"."synsets" USING "btree" ("pos");



CREATE INDEX "idx_word_examples_synset_id" ON "public"."word_examples" USING "btree" ("synset_id");



CREATE INDEX "idx_word_examples_word" ON "public"."word_examples" USING "btree" ("word");



CREATE INDEX "idx_word_synsets_sense_num" ON "public"."word_synsets" USING "btree" ("sense_number");



CREATE INDEX "idx_word_synsets_synset_id" ON "public"."word_synsets" USING "btree" ("synset_id");



CREATE INDEX "idx_word_synsets_tag_count" ON "public"."word_synsets" USING "btree" ("tag_count");



CREATE INDEX "idx_word_synsets_word" ON "public"."word_synsets" USING "btree" ("word");



CREATE INDEX "idx_words_difficulty_level" ON "public"."words" USING "btree" ("difficulty_level");



CREATE INDEX "idx_words_polysemy" ON "public"."words" USING "btree" ("polysemy");



CREATE INDEX "idx_words_pos" ON "public"."words" USING "btree" ("pos");



CREATE INDEX "idx_words_word" ON "public"."words" USING "btree" ("word");



ALTER TABLE ONLY "public"."daily_words"
    ADD CONSTRAINT "daily_words_word_fkey" FOREIGN KEY ("word") REFERENCES "public"."words"("word") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."distractors"
    ADD CONSTRAINT "distractors_word_fkey" FOREIGN KEY ("word") REFERENCES "public"."words"("word") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_from_synset_id_fkey" FOREIGN KEY ("from_synset_id") REFERENCES "public"."synsets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_to_synset_id_fkey" FOREIGN KEY ("to_synset_id") REFERENCES "public"."synsets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."word_examples"
    ADD CONSTRAINT "word_examples_synset_id_fkey" FOREIGN KEY ("synset_id") REFERENCES "public"."synsets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."word_examples"
    ADD CONSTRAINT "word_examples_word_fkey" FOREIGN KEY ("word") REFERENCES "public"."words"("word") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."word_metadata"
    ADD CONSTRAINT "word_metadata_word_fkey" FOREIGN KEY ("word") REFERENCES "public"."words"("word") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."word_synsets"
    ADD CONSTRAINT "word_synsets_synset_id_fkey" FOREIGN KEY ("synset_id") REFERENCES "public"."synsets"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public read access" ON "public"."daily_words" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."distractors" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."domains" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."relationships" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."synsets" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."word_examples" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."word_metadata" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."word_synsets" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."words" FOR SELECT USING (true);



CREATE POLICY "Allow service role to manage" ON "public"."daily_words" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow service role to manage" ON "public"."distractors" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow service role to manage" ON "public"."domains" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow service role to manage" ON "public"."relationships" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow service role to manage" ON "public"."synsets" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow service role to manage" ON "public"."word_examples" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow service role to manage" ON "public"."word_metadata" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow service role to manage" ON "public"."word_synsets" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow service role to manage" ON "public"."words" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."daily_words" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."distractors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."synsets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."word_examples" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."word_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."word_synsets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."words" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_daily_words"("target_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_daily_words"("target_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_daily_words"("target_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_exists"("word_to_check" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_exists"("word_to_check" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_exists"("word_to_check" "text") TO "service_role";



GRANT ALL ON TABLE "public"."synsets" TO "anon";
GRANT ALL ON TABLE "public"."synsets" TO "authenticated";
GRANT ALL ON TABLE "public"."synsets" TO "service_role";



GRANT ALL ON TABLE "public"."word_metadata" TO "anon";
GRANT ALL ON TABLE "public"."word_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."word_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."word_synsets" TO "anon";
GRANT ALL ON TABLE "public"."word_synsets" TO "authenticated";
GRANT ALL ON TABLE "public"."word_synsets" TO "service_role";



GRANT ALL ON TABLE "public"."words" TO "anon";
GRANT ALL ON TABLE "public"."words" TO "authenticated";
GRANT ALL ON TABLE "public"."words" TO "service_role";



GRANT ALL ON TABLE "public"."complete_word_view" TO "anon";
GRANT ALL ON TABLE "public"."complete_word_view" TO "authenticated";
GRANT ALL ON TABLE "public"."complete_word_view" TO "service_role";



GRANT ALL ON TABLE "public"."daily_words" TO "anon";
GRANT ALL ON TABLE "public"."daily_words" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_words" TO "service_role";



GRANT ALL ON TABLE "public"."daily_word_details" TO "anon";
GRANT ALL ON TABLE "public"."daily_word_details" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_word_details" TO "service_role";



GRANT ALL ON SEQUENCE "public"."daily_words_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."daily_words_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."daily_words_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."distractors" TO "anon";
GRANT ALL ON TABLE "public"."distractors" TO "authenticated";
GRANT ALL ON TABLE "public"."distractors" TO "service_role";



GRANT ALL ON SEQUENCE "public"."distractors_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distractors_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distractors_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."domains" TO "anon";
GRANT ALL ON TABLE "public"."domains" TO "authenticated";
GRANT ALL ON TABLE "public"."domains" TO "service_role";



GRANT ALL ON TABLE "public"."relationships" TO "anon";
GRANT ALL ON TABLE "public"."relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."relationships" TO "service_role";



GRANT ALL ON SEQUENCE "public"."relationships_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."relationships_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."relationships_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."word_antonyms" TO "anon";
GRANT ALL ON TABLE "public"."word_antonyms" TO "authenticated";
GRANT ALL ON TABLE "public"."word_antonyms" TO "service_role";



GRANT ALL ON TABLE "public"."word_definitions" TO "anon";
GRANT ALL ON TABLE "public"."word_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."word_definitions" TO "service_role";



GRANT ALL ON TABLE "public"."word_examples" TO "anon";
GRANT ALL ON TABLE "public"."word_examples" TO "authenticated";
GRANT ALL ON TABLE "public"."word_examples" TO "service_role";



GRANT ALL ON SEQUENCE "public"."word_examples_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."word_examples_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."word_examples_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."word_hypernyms" TO "anon";
GRANT ALL ON TABLE "public"."word_hypernyms" TO "authenticated";
GRANT ALL ON TABLE "public"."word_hypernyms" TO "service_role";



GRANT ALL ON TABLE "public"."word_hyponyms" TO "anon";
GRANT ALL ON TABLE "public"."word_hyponyms" TO "authenticated";
GRANT ALL ON TABLE "public"."word_hyponyms" TO "service_role";



GRANT ALL ON TABLE "public"."word_synonyms" TO "anon";
GRANT ALL ON TABLE "public"."word_synonyms" TO "authenticated";
GRANT ALL ON TABLE "public"."word_synonyms" TO "service_role";



GRANT ALL ON SEQUENCE "public"."word_synsets_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."word_synsets_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."word_synsets_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."word_with_examples" TO "anon";
GRANT ALL ON TABLE "public"."word_with_examples" TO "authenticated";
GRANT ALL ON TABLE "public"."word_with_examples" TO "service_role";



GRANT ALL ON SEQUENCE "public"."words_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."words_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."words_id_seq" TO "service_role";



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
