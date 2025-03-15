-- Script to fix the word_with_examples view to exclude NULL example values
-- This modifies the existing view to filter out NULL examples

-- Display current view definition for reference
SELECT pg_get_viewdef('word_with_examples'::regclass, true);

-- Drop and recreate the view to exclude NULL examples
CREATE OR REPLACE VIEW "public"."word_with_examples" AS
 SELECT "w"."word",
    "s"."definition",
    "e"."example"
   FROM ((("public"."words" "w"
     JOIN "public"."word_synsets" "ws" ON (("w"."word" = "ws"."word")))
     JOIN "public"."synsets" "s" ON (("ws"."synset_id" = "s"."id")))
     JOIN "public"."word_examples" "e" ON ((("w"."word" = "e"."word") AND ("ws"."synset_id" = "e"."synset_id"))))
   WHERE "e"."example" IS NOT NULL;

-- Note: This changes the LEFT JOIN to a regular JOIN and adds a WHERE clause
-- to exclude NULL examples. This ensures the view only returns rows with actual examples.

-- Verify the updated view
SELECT count(*) FROM word_with_examples;

-- Create a new view that joins examples specifically
-- This gives a better way to access examples by word
CREATE OR REPLACE VIEW "public"."word_examples_view" AS
SELECT 
    w.word,
    ws.synset_id,
    s.definition,
    s.pos,
    array_agg(e.example) AS examples
FROM 
    public.words w
JOIN 
    public.word_synsets ws ON w.word = ws.word
JOIN 
    public.synsets s ON ws.synset_id = s.id
JOIN 
    public.word_examples e ON w.word = e.word AND ws.synset_id = e.synset_id
WHERE 
    e.example IS NOT NULL
GROUP BY
    w.word, ws.synset_id, s.definition, s.pos
ORDER BY
    w.word, ws.sense_number;

-- Grant appropriate permissions
GRANT ALL ON TABLE "public"."word_examples_view" TO "anon";
GRANT ALL ON TABLE "public"."word_examples_view" TO "authenticated";
GRANT ALL ON TABLE "public"."word_examples_view" TO "service_role"; 