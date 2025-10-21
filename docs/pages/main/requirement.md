# 메인 (지도) 페이지 요구사항

## 개요

메인 페이지(`/`)는 사용자가 지도를 통해 맛집을 탐색하고, 장소를 검색하며, 리뷰가 등록된 음식점을 마커로 확인할 수 있는 핵심 페이지입니다.

## 페이지 경로
- **URL**: `/`
- **복잡도 레벨**: Level 3 (Context + useReducer)

## 주요 기능

### 1. 지도 표시 및 조작
- Naver Maps SDK를 사용한 인터랙티브 지도 표시
- 사용자가 지도를 드래그(pan)하여 이동 가능
- 사용자가 지도를 확대/축소(zoom) 가능
- 지도 중심 좌표 및 줌 레벨 상태 관리

### 2. 장소 검색
- 상단에 고정된 검색창 제공
- 사용자가 키워드(장소명, 지역명 등)를 입력하여 음식점 검색
- 검색 실행 트리거: Enter 키 또는 검색 버튼 클릭
- 검색 입력값의 클라이언트 측 유효성 검증 (최소 2자, 최대 50자)
- 디바운싱 적용 (0.5초 지연) - 불필요한 API 호출 방지

### 3. 검색 결과 표시
- 검색 성공 시, 지도 뷰를 검색 결과 위치로 자동 이동 및 줌 조정
- 검색 결과를 배너 형태로 화면에 표시
- 배너 내용:
  - 장소명
  - 주소 (지번 주소 또는 도로명 주소)
  - 업종 (카테고리)
  - "리뷰 작성하기" 버튼
- 최대 5개의 검색 결과 표시

### 4. 마커 표시
- 리뷰가 1개 이상 등록된 음식점에 대한 마커를 지도에 표시
- 마커 데이터는 백엔드 API를 통해 조회 (`/api/places?hasReviews=true`)
- 각 마커는 해당 장소의 `placeId`와 연결됨
- 사용자가 마커를 클릭하면 해당 장소의 상세 페이지(`/place/[placeId]`)로 이동

### 5. 에러 처리 및 피드백
- **입력 유효성 오류**: "검색어를 입력하세요" 또는 "검색어는 2자 이상 50자 이하여야 합니다" 메시지 표시
- **검색 결과 없음**: "검색 결과가 없습니다. 다른 키워드로 검색해주세요" 메시지 표시
- **외부 API 오류**: "검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요" 스낵바 표시
- **네트워크 타임아웃**: "요청 시간이 초과되었습니다" 메시지 표시
- **마커 조회 오류**: "장소 정보를 불러오는 데 실패했습니다" 스낵바 표시

## 데이터 흐름

### 1. 검색 플로우 (Use Case 001)

```
사용자 입력 → 클라이언트 유효성 검증
  ↓
백엔드 API 호출 (/api/search?query=...)
  ↓
Naver Search API 호출
  ↓
검색 결과 변환 (KATECH → WGS84 좌표, HTML 태그 제거)
  ↓
클라이언트 수신
  ↓
지도 뷰 이동/줌 조정 + 배너 렌더링
```

### 2. 마커 표시 플로우

```
페이지 마운트
  ↓
백엔드 API 호출 (/api/places?hasReviews=true)
  ↓
Supabase DB 조회 (places 테이블, review_count > 0)
  ↓
장소 목록 수신 (id, name, latitude, longitude)
  ↓
지도에 마커 렌더링
```

### 3. 마커 클릭 플로우 (Use Case 005)

```
사용자가 마커 클릭
  ↓
placeId 추출
  ↓
/place/[placeId] 경로로 네비게이션
```

## 데이터베이스 상호작용

### 1. 마커 조회 (읽기 전용)
- **테이블**: `places`
- **조건**: `review_count > 0`
- **조회 필드**: `id`, `name`, `latitude`, `longitude`, `average_rating`, `review_count`
- **API Endpoint**: `GET /api/places?hasReviews=true`
- **타이밍**: 페이지 마운트 시 또는 검색 후 갱신 시

### 2. 검색 (외부 API만 사용, DB 미사용)
- 검색 단계에서는 DB 저장 없음
- Naver Search API를 통한 실시간 검색
- 장소 저장은 사용자가 리뷰 작성 시에만 수행 (Use Case 002)

## 컴포넌트 계층 구조

```
MainPage (/)
├─ MapProvider (Context Provider)
│  ├─ SearchBar
│  │  └─ SearchInput
│  ├─ MapView
│  │  ├─ NaverMap (react-naver-maps)
│  │  └─ Markers (장소 마커들)
│  ├─ SearchResultBanner (검색 결과 배너)
│  │  └─ SearchResultItem (개별 검색 결과)
│  │     └─ WriteReviewButton
│  └─ ErrorSnackbar (에러 피드백)
```

## 상태 복잡도 분석

### 복잡도 점수: 18점 (Level 3)
- **상태 복잡도**: 6점
  - 지도 상태 (중심 좌표, 줌 레벨)
  - 검색 상태 (검색어, 검색 결과, 로딩, 에러)
  - 마커 데이터 (장소 목록)
  - 배너 표시 상태
  - UI 상태 (에러 메시지, 로딩 인디케이터)

- **상호작용 복잡도**: 5점
  - 검색 입력 및 실행
  - 지도 드래그/줌 조작
  - 마커 클릭
  - 외부 API 호출 (Naver Search API)
  - 백엔드 API 호출 (마커 조회)

- **컴포넌트 계층**: 4점 (5단계)
  - MainPage → MapProvider → SearchBar/MapView/Banner → 하위 컴포넌트

- **데이터 흐름**: 3점
  - Naver Search API (외부)
  - 백엔드 API (내부)
  - 좌표 변환 로직 (KATECH ↔ WGS84)

## 비기능 요구사항

### 1. 성능
- 검색 API 호출 타임아웃: 10초
- 디바운싱: 0.5초
- 마커 조회는 최초 1회만 수행 (React Query 캐싱 활용)

### 2. 보안
- `NCP_CLIENT_SECRET`은 백엔드에서만 사용 (클라이언트 노출 금지)
- 모든 Naver API 호출은 백엔드를 경유

### 3. 접근성
- 검색 입력 필드에 `aria-label` 제공
- 검색 결과 배너에 키보드 네비게이션 지원
- 오류 메시지에 `role="alert"` 사용

### 4. 사용자 경험
- 검색 중 로딩 스피너 표시
- 지도 이동 애니메이션 부드럽게 처리
- 에러 메시지는 스낵바 형태로 자동 소멸 (5초)

## 관련 Use Cases
- **Use Case 001**: 장소(음식점) 검색
- **Use Case 005**: 장소 상세 정보 조회 (지도 마커 경유)

## 외부 서비스 의존성
- **Naver Maps JavaScript SDK**: 지도 렌더링
- **Naver Search API (Local)**: 장소 검색
- **react-naver-maps**: React 래퍼 라이브러리

## 참조 문서
- `/docs/prd.md` - 제품 요구사항 정의서
- `/docs/userflow.md` - 유저 플로우 1, 5
- `/docs/usecases/001/spec.md` - 장소 검색 유스케이스
- `/docs/usecases/005/spec.md` - 장소 상세 조회 유스케이스
- `/docs/external/naver_map.md` - Naver API 연동 가이드
