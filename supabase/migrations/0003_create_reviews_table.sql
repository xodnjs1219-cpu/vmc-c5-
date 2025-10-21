-- Migration: Create reviews table
-- Description: 리뷰 정보를 저장하는 테이블 생성 (places 테이블과 연결)
-- Created: 2025-10-21

BEGIN;

-- reviews 테이블 생성
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
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

-- Rollback script (참고용, 실제 실행 시 주석 해제)
-- BEGIN;
-- DROP INDEX IF EXISTS idx_reviews_created_at;
-- DROP INDEX IF EXISTS idx_reviews_place_id;
-- DROP TABLE IF EXISTS reviews CASCADE;
-- COMMIT;
