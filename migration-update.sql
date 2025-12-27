-- This migration updates the 'stones' table to store the full 512-dimension embedding vector.
ALTER TABLE stones ALTER COLUMN embedding TYPE VECTOR(512);
