-- Migration: Create updated_at trigger function and apply to all tables
-- Description: 모든 테이블의 updated_at 컬럼을 자동으로 갱신하는 트리거 함수 및 트리거 생성
-- Created: 2025-10-21

BEGIN;

-- 트리거 함수 생성 (모든 테이블에서 재사용 가능)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'UPDATE 시 updated_at 컬럼을 현재 시각으로 자동 갱신하는 트리거 함수';

-- places 테이블에 트리거 적용
DROP TRIGGER IF EXISTS set_places_updated_at ON places;
CREATE TRIGGER set_places_updated_at
BEFORE UPDATE ON places
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- reviews 테이블에 트리거 적용
DROP TRIGGER IF EXISTS set_reviews_updated_at ON reviews;
CREATE TRIGGER set_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Rollback script (참고용, 실제 실행 시 주석 해제)
-- BEGIN;
-- DROP TRIGGER IF EXISTS set_reviews_updated_at ON reviews;
-- DROP TRIGGER IF EXISTS set_places_updated_at ON places;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- COMMIT;
