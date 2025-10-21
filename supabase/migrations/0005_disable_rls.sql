-- Migration: Disable Row Level Security (RLS)
-- Description: 프로젝트 정책에 따라 모든 테이블의 RLS를 비활성화
-- Created: 2025-10-21

BEGIN;

-- places 테이블 RLS 비활성화
ALTER TABLE places DISABLE ROW LEVEL SECURITY;

-- reviews 테이블 RLS 비활성화
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- RLS 정책 제거 (존재하는 경우)
DROP POLICY IF EXISTS places_select_policy ON places;
DROP POLICY IF EXISTS places_insert_policy ON places;
DROP POLICY IF EXISTS places_update_policy ON places;
DROP POLICY IF EXISTS places_delete_policy ON places;

DROP POLICY IF EXISTS reviews_select_policy ON reviews;
DROP POLICY IF EXISTS reviews_insert_policy ON reviews;
DROP POLICY IF EXISTS reviews_update_policy ON reviews;
DROP POLICY IF EXISTS reviews_delete_policy ON reviews;

COMMIT;

-- Note: RLS 재활성화가 필요한 경우
-- ALTER TABLE places ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
