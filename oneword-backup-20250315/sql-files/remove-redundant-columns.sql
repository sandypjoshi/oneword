-- Script to safely remove redundant columns from words table
-- This removes the definitions and examples columns that are redundant with word_definitions and word_with_examples views

-- First verify that the columns exist (to make this script idempotent)
DO $$
BEGIN
    -- Check if definitions column exists and remove it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'words' 
        AND column_name = 'definitions'
    ) THEN
        ALTER TABLE public.words DROP COLUMN definitions;
        RAISE NOTICE 'Column "definitions" removed from words table';
    ELSE
        RAISE NOTICE 'Column "definitions" does not exist in words table - no action needed';
    END IF;
    
    -- Check if examples column exists and remove it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'words' 
        AND column_name = 'examples'
    ) THEN
        ALTER TABLE public.words DROP COLUMN examples;
        RAISE NOTICE 'Column "examples" removed from words table';
    ELSE
        RAISE NOTICE 'Column "examples" does not exist in words table - no action needed';
    END IF;
END $$;

-- Update any views that might depend on these columns
-- This is left intentionally without content as we need to check
-- which views reference these columns and handle them individually 