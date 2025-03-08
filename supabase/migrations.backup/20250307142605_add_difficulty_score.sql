-- Add difficulty_score column to daily_words table
ALTER TABLE public.daily_words
ADD COLUMN difficulty_score DECIMAL(10, 6); 