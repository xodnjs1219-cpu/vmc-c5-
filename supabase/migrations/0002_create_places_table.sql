-- Migration: Create places table
-- Description: 장소(음식점) 정보를 저장하는 테이블 생성
-- Created: 2025-10-21

BEGIN;

-- places 테이블 생성
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) NOT NULL UNIQUE,  -- 외부 API 장소 고유 ID (Kakao, Naver 등)
  name VARCHAR(255) NOT NULL,                -- 장소명
  address TEXT NOT NULL,                     -- 주소
  category VARCHAR(100),                     -- 업종 (예: 한식, 카페, 일식)
  latitude DECIMAL(10, 8) NOT NULL,          -- 위도
  longitude DECIMAL(11, 8) NOT NULL,         -- 경도
  average_rating DECIMAL(2, 1) DEFAULT 0.0 CHECK (average_rating >= 0.0 AND average_rating <= 5.0),  -- 평균 평점 (0.0 ~ 5.0)
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),  -- 리뷰 개수
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_places_external_id ON places(external_id);
CREATE INDEX IF NOT EXISTS idx_places_review_count ON places(review_count) WHERE review_count > 0;
CREATE INDEX IF NOT EXISTS idx_places_location ON places(latitude, longitude);

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE places IS '장소(음식점) 정보 테이블';
COMMENT ON COLUMN places.id IS '장소 고유 ID (UUID)';
COMMENT ON COLUMN places.external_id IS '외부 지도 API의 장소 고유 ID';
COMMENT ON COLUMN places.name IS '장소명 (가게 이름)';
COMMENT ON COLUMN places.address IS '장소 주소';
COMMENT ON COLUMN places.category IS '업종 (한식, 일식, 카페 등)';
COMMENT ON COLUMN places.latitude IS '위도 (-90 ~ 90)';
COMMENT ON COLUMN places.longitude IS '경도 (-180 ~ 180)';
COMMENT ON COLUMN places.average_rating IS '리뷰 평점의 평균값 (계산값, 0.0 ~ 5.0)';
COMMENT ON COLUMN places.review_count IS '해당 장소에 작성된 리뷰 개수';
COMMENT ON COLUMN places.created_at IS '레코드 생성 시각';
COMMENT ON COLUMN places.updated_at IS '레코드 최종 수정 시각 (트리거로 자동 갱신)';

COMMIT;

-- Rollback script (참고용, 실제 실행 시 주석 해제)
-- BEGIN;
-- DROP INDEX IF EXISTS idx_places_location;
-- DROP INDEX IF EXISTS idx_places_review_count;
-- DROP INDEX IF EXISTS idx_places_external_id;
-- DROP TABLE IF EXISTS places CASCADE;
-- COMMIT;
