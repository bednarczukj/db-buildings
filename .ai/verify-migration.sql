-- Verify migration 20251011220000_adapt_buildings_for_api

\echo 'Checking if new columns exist...'
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'buildings' 
  AND column_name IN ('building_number', 'created_by', 'updated_by', 'city_district_code', 'id')
ORDER BY column_name;

\echo ''
\echo 'Checking if view buildings_api exists...'
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.views 
  WHERE table_name = 'buildings_api'
) as view_exists;

\echo ''
\echo 'Checking indexes on new columns...'
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'buildings' 
  AND indexname LIKE '%building_number%' 
   OR indexname LIKE '%created_by%' 
   OR indexname LIKE '%updated_by%';

\echo ''
\echo 'Migration verification complete!'

