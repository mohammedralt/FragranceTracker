-- Adds Fragrantica-style metadata to the catalog.
-- Season columns hold the community vote score for each season (raw count or %,
-- whatever the dataset provides — only their relative size matters for filtering).
-- Run in Supabase SQL editor, or it runs automatically via the importer.

ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS season_spring SMALLINT;
ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS season_summer SMALLINT;
ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS season_fall   SMALLINT;
ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS season_winter SMALLINT;
ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS accords       TEXT[];
ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS year          SMALLINT;
