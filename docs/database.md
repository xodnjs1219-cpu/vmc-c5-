# 데이터베이스 설계 문서

## 1. 데이터 흐름 다이어그램

### 1.1 엔티티 관계 개요

```
┌─────────────────┐
│     places      │ 장소(음식점) 정보
│─────────────────│
│ id (PK)         │
│ external_id     │ 외부 API 장소 고유 ID
│ name            │ 장소명
│ address         │ 주소
│ category        │ 업종
│ latitude        │ 위도
│ longitude       │ 경도
│ average_rating  │ 평균 평점 (계산값)
│ review_count    │ 리뷰 개수
│ created_at      │
│ updated_at      │
└─────────────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│     reviews     │ 리뷰 정보
│─────────────────│
│ id (PK)         │
│ place_id (FK)   │ → places.id
│ author_name     │ 작성자명
│ rating          │ 평점 (1-5)
│ content         │ 리뷰 내용
│ password_hash   │ 비밀번호 해시
│ created_at      │
│ updated_at      │
└─────────────────┘
```

### 1.2 주요 데이터 플로우

#### 플로우 1: 장소 검색 및 등록
```
[사용자] --검색 키워드--> [외부 지도 API]
                              │
                              ▼
                        [장소 데이터 반환]
                        (name, address, category, lat, lng, external_id)
                              │
                              ▼
                        [places 테이블 확인]
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
              [이미 존재]        [신규 장소]
                     │                 │
                     │                 ▼
                     │         [places INSERT]
                     │         (review_count=0)
                     │                 │
                     └────────┬────────┘
                              ▼
                    [사용자에게 장소 정보 반환]
```

#### 플로우 2: 리뷰 작성
```
[사용자] --리뷰 폼 제출--> [서버]
  (author_name, rating, content, password)
                              │
                              ▼
                    [유효성 검증]
                              │
                              ▼
                    [비밀번호 해시 처리]
                              │
                              ▼
                    [reviews INSERT]
                    (place_id, author_name, rating, content, password_hash)
                              │
                              ▼
                    [places UPDATE]
                    - review_count++
                    - average_rating 재계산
                              │
                              ▼
                    [장소 상세 페이지로 리다이렉트]
```

#### 플로우 3: 리뷰 수정
```
[사용자] --수정 버튼 클릭--> [비밀번호 확인 모달]
                                    │
                                    ▼
                        [입력한 비밀번호 해시화]
                                    │
                                    ▼
                        [reviews SELECT password_hash WHERE id=?]
                                    │
                           ┌────────┴────────┐
                           ▼                 ▼
                    [해시 일치]        [해시 불일치]
                           │                 │
                           ▼                 ▼
                   [수정 페이지 진입]   [인증 실패 메시지]
                   (기존 데이터 로드)
                           │
                           ▼
                [사용자 수정 완료 후 제출]
                           │
                           ▼
                   [reviews UPDATE]
                   (author_name, rating, content)
                           │
                           ▼
                   [places UPDATE]
                   - average_rating 재계산
                           │
                           ▼
                [장소 상세 페이지로 리다이렉트]
```

#### 플로우 4: 리뷰 삭제
```
[사용자] --삭제 버튼 클릭--> [비밀번호 확인 모달]
                                    │
                                    ▼
                        [입력한 비밀번호 해시화]
                                    │
                                    ▼
                        [reviews SELECT password_hash WHERE id=?]
                                    │
                           ┌────────┴────────┐
                           ▼                 ▼
                    [해시 일치]        [해시 불일치]
                           │                 │
                           ▼                 ▼
                   [reviews DELETE]    [인증 실패 메시지]
                           │
                           ▼
                   [places UPDATE]
                   - review_count--
                   - average_rating 재계산
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
          [review_count > 0]  [review_count = 0]
                  │                 │
                  │                 ▼
                  │         [메인 지도에서 마커 제거]
                  │
                  ▼
        [장소 상세 페이지 새로고침]
```

#### 플로우 5: 지도 마커 표시
```
[메인 페이지 로드] --> [places SELECT WHERE review_count > 0]
                                │
                                ▼
                    [장소 목록 반환]
                    (id, name, latitude, longitude, average_rating)
                                │
                                ▼
                    [지도에 마커 렌더링]
```

#### 플로우 6: 장소 상세 조회
```
[사용자] --마커 클릭--> [place_id 식별]
                              │
                              ▼
                    [places SELECT WHERE id=?]
                              │
                              ▼
                    [reviews SELECT WHERE place_id=? ORDER BY created_at DESC]
                              │
                              ▼
                    [장소 정보 + 리뷰 목록 반환]
                              │
                              ▼
                    [장소 상세 페이지 렌더링]
```

---

## 2. 데이터베이스 스키마 (PostgreSQL)

### 2.1 테이블: places

장소(음식점) 정보를 저장하는 테이블.

```sql
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) NOT NULL UNIQUE,  -- 외부 API 장소 고유 ID (Kakao, Naver 등)
  name VARCHAR(255) NOT NULL,                -- 장소명
  address TEXT NOT NULL,                     -- 주소
  category VARCHAR(100),                     -- 업종 (예: 한식, 카페, 일식)
  latitude DECIMAL(10, 8) NOT NULL,          -- 위도
  longitude DECIMAL(11, 8) NOT NULL,         -- 경도
  average_rating DECIMAL(2, 1) DEFAULT 0.0,  -- 평균 평점 (0.0 ~ 5.0)
  review_count INTEGER DEFAULT 0,            -- 리뷰 개수
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_places_external_id ON places(external_id);
CREATE INDEX IF NOT EXISTS idx_places_review_count ON places(review_count) WHERE review_count > 0;
CREATE INDEX IF NOT EXISTS idx_places_location ON places(latitude, longitude);

-- 코멘트
COMMENT ON TABLE places IS '장소(음식점) 정보 테이블';
COMMENT ON COLUMN places.external_id IS '외부 지도 API의 장소 고유 ID';
COMMENT ON COLUMN places.average_rating IS '리뷰 평점의 평균값 (계산값)';
COMMENT ON COLUMN places.review_count IS '해당 장소에 작성된 리뷰 개수';
```

### 2.2 테이블: reviews

리뷰 정보를 저장하는 테이블.

```sql
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

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- 코멘트
COMMENT ON TABLE reviews IS '리뷰 정보 테이블';
COMMENT ON COLUMN reviews.password_hash IS '리뷰 수정/삭제용 비밀번호 해시값';
COMMENT ON COLUMN reviews.rating IS '평점 (1-5 정수)';
```

### 2.3 Trigger: updated_at 자동 갱신

모든 테이블의 `updated_at` 컬럼을 자동으로 갱신하는 트리거 함수 및 트리거.

```sql
-- Trigger 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- places 테이블에 트리거 적용
CREATE TRIGGER set_places_updated_at
BEFORE UPDATE ON places
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- reviews 테이블에 트리거 적용
CREATE TRIGGER set_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 2.4 RLS (Row Level Security) 비활성화

프로젝트 요구사항에 따라 RLS를 비활성화합니다.

```sql
ALTER TABLE places DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
```

---

## 3. 주요 쿼리 패턴

### 3.1 장소 검색 (외부 API 결과 기반)

```sql
-- external_id로 기존 장소 확인
SELECT id, name, address, category, latitude, longitude, average_rating, review_count
FROM places
WHERE external_id = $1;

-- 존재하지 않으면 INSERT
INSERT INTO places (external_id, name, address, category, latitude, longitude)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id;
```

### 3.2 리뷰 작성

```sql
-- 리뷰 INSERT
INSERT INTO reviews (place_id, author_name, rating, content, password_hash)
VALUES ($1, $2, $3, $4, $5)
RETURNING id;

-- 장소의 평균 평점 및 리뷰 개수 갱신
UPDATE places
SET
  review_count = (SELECT COUNT(*) FROM reviews WHERE place_id = $1),
  average_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE place_id = $1)
WHERE id = $1;
```

### 3.3 비밀번호 인증 (수정/삭제)

```sql
-- 리뷰의 password_hash 조회
SELECT password_hash
FROM reviews
WHERE id = $1;

-- 애플리케이션 레벨에서 bcrypt.compare() 등으로 검증
```

### 3.4 리뷰 수정

```sql
-- 리뷰 데이터 조회 (수정 페이지용)
SELECT id, place_id, author_name, rating, content
FROM reviews
WHERE id = $1;

-- 리뷰 UPDATE
UPDATE reviews
SET author_name = $2, rating = $3, content = $4
WHERE id = $1;

-- 장소의 평균 평점 재계산
UPDATE places
SET average_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE place_id = $2)
WHERE id = $2;
```

### 3.5 리뷰 삭제

```sql
-- 리뷰 DELETE
DELETE FROM reviews
WHERE id = $1
RETURNING place_id;

-- 장소의 평균 평점 및 리뷰 개수 갱신
UPDATE places
SET
  review_count = (SELECT COUNT(*) FROM reviews WHERE place_id = $2),
  average_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE place_id = $2), 0.0)
WHERE id = $2;
```

### 3.6 지도 마커용 장소 목록 조회

```sql
-- 리뷰가 1개 이상인 장소만 조회
SELECT id, name, latitude, longitude, average_rating, review_count
FROM places
WHERE review_count > 0;
```

### 3.7 장소 상세 정보 + 리뷰 목록 조회

```sql
-- 장소 정보
SELECT id, name, address, category, average_rating, review_count
FROM places
WHERE id = $1;

-- 해당 장소의 리뷰 목록 (최신순)
SELECT id, author_name, rating, content, created_at, updated_at
FROM reviews
WHERE place_id = $1
ORDER BY created_at DESC;
```

---

## 4. 데이터 무결성 및 제약사항

### 4.1 제약사항 (Constraints)

1. **places.external_id**: UNIQUE - 외부 API의 동일 장소가 중복 저장되지 않음
2. **reviews.rating**: CHECK (1 <= rating <= 5) - 평점은 1~5 사이만 허용
3. **reviews.place_id**: FOREIGN KEY (ON DELETE CASCADE) - 장소 삭제 시 관련 리뷰도 함께 삭제

### 4.2 데이터 정합성 유지

1. **평균 평점 계산**: 리뷰 작성/수정/삭제 시 `places.average_rating` 자동 갱신
2. **리뷰 개수 관리**: 리뷰 작성/삭제 시 `places.review_count` 자동 갱신
3. **updated_at 자동 갱신**: 트리거를 통해 모든 UPDATE 시 자동으로 현재 시각으로 갱신

### 4.3 보안

1. **비밀번호 해시**: 원본 비밀번호는 절대 저장하지 않으며, bcrypt 등의 단방향 해시로 저장
2. **RLS 비활성화**: 프로젝트 정책에 따라 RLS는 사용하지 않음
3. **인증 로직**: 애플리케이션 레벨에서 비밀번호 해시 비교를 통한 인증 처리

---

## 5. 향후 확장 고려사항 (MVP 이후)

1. **이미지 업로드**: reviews 테이블에 image_urls (JSON 또는 별도 테이블) 추가
2. **좋아요/신고 기능**: review_likes, review_reports 테이블 추가
3. **사용자 계정 시스템**: users 테이블 추가 및 reviews.user_id 외래키 연결
4. **태그/카테고리 필터링**: place_tags, tags 테이블 추가 (Many-to-Many)
5. **소프트 딜리트**: reviews.deleted_at 컬럼 추가 (하드 딜리트 대신)

---

## 6. 마이그레이션 파일

실제 마이그레이션 SQL은 `/supabase/migrations/` 디렉토리의 파일을 참조하세요.

- `0001_create_places_table.sql`: places 테이블 생성
- `0002_create_reviews_table.sql`: reviews 테이블 생성
- `0003_create_updated_at_trigger.sql`: updated_at 자동 갱신 트리거 설정
- `0004_disable_rls.sql`: RLS 비활성화
