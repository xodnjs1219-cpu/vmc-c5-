-- Migration: Update places table schema
-- Description: places 테이블을 현재 구현에 맞게 업데이트 (외부_id 제거, id를 문자열로)
-- Created: 2025-10-21

BEGIN;

-- 기존 places 테이블이 있으면 삭제 (외래키 때문에 reviews 먼저 삭제)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS places CASCADE;

-- places 테이블 생성 (업데이트된 스키마)
CREATE TABLE IF NOT EXISTS places (
  id VARCHAR(255) PRIMARY KEY,               -- 장소 고유 ID (이름 기반)
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
CREATE INDEX IF NOT EXISTS idx_places_review_count ON places(review_count) WHERE review_count > 0;
CREATE INDEX IF NOT EXISTS idx_places_location ON places(latitude, longitude);

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE places IS '장소(음식점) 정보 테이블';
COMMENT ON COLUMN places.id IS '장소 고유 ID (이름 기반 문자열)';
COMMENT ON COLUMN places.name IS '장소명 (가게 이름)';
COMMENT ON COLUMN places.address IS '장소 주소';
COMMENT ON COLUMN places.category IS '업종 (한식, 일식, 카페 등)';
COMMENT ON COLUMN places.latitude IS '위도 (-90 ~ 90)';
COMMENT ON COLUMN places.longitude IS '경도 (-180 ~ 180)';
COMMENT ON COLUMN places.average_rating IS '리뷰 평점의 평균값 (계산값, 0.0 ~ 5.0)';
COMMENT ON COLUMN places.review_count IS '해당 장소에 작성된 리뷰 개수';
COMMENT ON COLUMN places.created_at IS '레코드 생성 시각';
COMMENT ON COLUMN places.updated_at IS '레코드 최종 수정 시각 (트리거로 자동 갱신)';

-- reviews 테이블 생성
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id VARCHAR(255) NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  author_name VARCHAR(50) NOT NULL,          -- 작성자명
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),  -- 평점 (1-5)
  content TEXT NOT NULL,                     -- 리뷰 내용
  password_hash VARCHAR(255) NOT NULL,       -- 비밀번호 해시 (bcrypt 등)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- 테이블 및 컬럼 코멘트
COMMENT ON TABLE reviews IS '리뷰 정보 테이블';
COMMENT ON COLUMN reviews.id IS '리뷰 고유 ID (UUID)';
COMMENT ON COLUMN reviews.place_id IS '리뷰가 작성된 장소 ID (places 테이블 참조)';
COMMENT ON COLUMN reviews.author_name IS '리뷰 작성자명 (익명, 최대 50자)';
COMMENT ON COLUMN reviews.rating IS '평점 (1-5 정수)';
COMMENT ON COLUMN reviews.content IS '리뷰 내용 (텍스트)';
COMMENT ON COLUMN reviews.password_hash IS '리뷰 수정/삭제용 비밀번호 해시값 (bcrypt)';
COMMENT ON COLUMN reviews.created_at IS '리뷰 작성 시각';
COMMENT ON COLUMN reviews.updated_at IS '리뷰 최종 수정 시각 (트리거로 자동 갱신)';

COMMIT;
