# 메인 (지도) 페이지 상태 관리 설계

## 복잡도 레벨
**Level 3: Context + useReducer**

---

## 1. 상태 데이터 식별

### 1.1. 관리해야 할 상태 (State)

#### A. 지도 상태 (Map State)
| 상태명 | 타입 | 초기값 | 설명 |
|-------|-----|-------|------|
| `center` | `{ lat: number; lng: number }` | `{ lat: 37.5665, lng: 126.9780 }` (서울시청) | 지도 중심 좌표 (WGS84) |
| `zoom` | `number` | `13` | 지도 줌 레벨 (1-21) |

#### B. 검색 상태 (Search State)
| 상태명 | 타입 | 초기값 | 설명 |
|-------|-----|-------|------|
| `searchQuery` | `string` | `""` | 사용자가 입력한 검색 키워드 |
| `searchResults` | `SearchResult[]` | `[]` | 검색 결과 목록 (최대 5개) |
| `isSearching` | `boolean` | `false` | 검색 API 호출 중 여부 |
| `searchError` | `string \| null` | `null` | 검색 중 발생한 에러 메시지 |

#### C. 마커 상태 (Marker State)
| 상태명 | 타입 | 초기값 | 설명 |
|-------|-----|-------|------|
| `places` | `PlaceMarker[]` | `[]` | 리뷰가 있는 장소 목록 (DB 조회) |
| `isLoadingPlaces` | `boolean` | `false` | 마커 데이터 로딩 중 여부 |
| `placesError` | `string \| null` | `null` | 마커 조회 중 발생한 에러 메시지 |

#### D. UI 상태 (UI State)
| 상태명 | 타입 | 초기값 | 설명 |
|-------|-----|-------|------|
| `showSearchResultBanner` | `boolean` | `false` | 검색 결과 배너 표시 여부 |
| `errorSnackbar` | `{ message: string; visible: boolean } \| null` | `null` | 전역 에러 스낵바 상태 |

### 1.2. 파생 데이터 (Derived Data, 상태가 아님)

다음 데이터는 화면에 표시되지만, 기존 상태로부터 계산되므로 별도로 저장하지 않습니다:

| 데이터명 | 파생 소스 | 설명 |
|---------|---------|------|
| `hasSearchResults` | `searchResults.length > 0` | 검색 결과가 있는지 여부 |
| `searchResultCount` | `searchResults.length` | 검색 결과 개수 |
| `isMapInteractive` | `!isSearching && !isLoadingPlaces` | 지도 조작 가능 여부 |
| `displaySearchError` | `searchError !== null` | 검색 에러 표시 여부 |
| `markerCount` | `places.length` | 지도에 표시된 마커 개수 |

---

## 2. 상태 전환 테이블

### 2.1. 검색 상태 전환

| 현재 상태 | 액션 | 다음 상태 | 화면 변화 |
|----------|-----|---------|----------|
| `searchQuery: ""` | `UPDATE_SEARCH_QUERY("강남역")` | `searchQuery: "강남역"` | 검색 입력 필드에 "강남역" 표시 |
| `isSearching: false` | `SEARCH_START` | `isSearching: true` | 검색 버튼 → 로딩 스피너 표시 |
| `isSearching: true` | `SEARCH_SUCCESS([...results])` | `isSearching: false`<br/>`searchResults: [...]`<br/>`showSearchResultBanner: true` | 로딩 스피너 숨김<br/>지도 이동<br/>검색 결과 배너 표시 |
| `isSearching: true` | `SEARCH_ERROR("오류 메시지")` | `isSearching: false`<br/>`searchError: "오류 메시지"`<br/>`errorSnackbar: { visible: true, ... }` | 로딩 스피너 숨김<br/>에러 스낵바 표시 |
| `searchResults: [...]` | `CLEAR_SEARCH_RESULTS` | `searchResults: []`<br/>`showSearchResultBanner: false` | 검색 결과 배너 숨김 |

### 2.2. 마커 상태 전환

| 현재 상태 | 액션 | 다음 상태 | 화면 변화 |
|----------|-----|---------|----------|
| `isLoadingPlaces: false` | `LOAD_PLACES_START` | `isLoadingPlaces: true` | (초기 로딩 표시 - 선택사항) |
| `isLoadingPlaces: true` | `LOAD_PLACES_SUCCESS([...places])` | `isLoadingPlaces: false`<br/>`places: [...]` | 지도에 마커들이 표시됨 |
| `isLoadingPlaces: true` | `LOAD_PLACES_ERROR("오류 메시지")` | `isLoadingPlaces: false`<br/>`placesError: "오류 메시지"`<br/>`errorSnackbar: { visible: true, ... }` | 에러 스낵바 표시<br/>마커 없음 |

### 2.3. 지도 상태 전환

| 현재 상태 | 액션 | 다음 상태 | 화면 변화 |
|----------|-----|---------|----------|
| `center: { lat: 37.5665, lng: 126.9780 }` | `UPDATE_MAP_CENTER({ lat: 37.4979, lng: 127.0276 })` | `center: { lat: 37.4979, lng: 127.0276 }` | 지도가 강남역으로 이동 (애니메이션) |
| `zoom: 13` | `UPDATE_MAP_ZOOM(15)` | `zoom: 15` | 지도가 확대됨 |
| `center: { ... }, zoom: 13` | `SEARCH_SUCCESS([...])` | `center: 검색 결과 중심 좌표`<br/>`zoom: 15` | 지도가 검색 결과 위치로 자동 이동 및 줌 조정 |

### 2.4. UI 상태 전환

| 현재 상태 | 액션 | 다음 상태 | 화면 변화 |
|----------|-----|---------|----------|
| `showSearchResultBanner: false` | `SEARCH_SUCCESS([...])` | `showSearchResultBanner: true` | 검색 결과 배너가 슬라이드 업 애니메이션으로 표시 |
| `showSearchResultBanner: true` | `CLOSE_SEARCH_BANNER` | `showSearchResultBanner: false` | 검색 결과 배너가 슬라이드 다운 애니메이션으로 숨김 |
| `errorSnackbar: null` | `SHOW_ERROR_SNACKBAR("메시지")` | `errorSnackbar: { message: "메시지", visible: true }` | 화면 하단에 에러 스낵바 표시 |
| `errorSnackbar: { visible: true, ... }` | `HIDE_ERROR_SNACKBAR` | `errorSnackbar: null` | 에러 스낵바가 페이드 아웃 |

---

## 3. Flux 패턴 설계

### 3.1. Flux 아키텍처 개요

```
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│   View   │──────▶│  Action  │──────▶│ Reducer  │──────▶│  State   │
│          │       │          │       │(Store)   │       │          │
└──────────┘       └──────────┘       └──────────┘       └──────────┘
     ▲                                                          │
     └──────────────────────────────────────────────────────────┘
                         (Re-render)
```

### 3.2. Action 정의

#### A. 검색 관련 액션

```typescript
// 검색어 업데이트
type UpdateSearchQueryAction = {
  type: 'UPDATE_SEARCH_QUERY';
  payload: string;
};

// 검색 시작
type SearchStartAction = {
  type: 'SEARCH_START';
};

// 검색 성공
type SearchSuccessAction = {
  type: 'SEARCH_SUCCESS';
  payload: {
    results: SearchResult[];
    center: { lat: number; lng: number };
    zoom: number;
  };
};

// 검색 실패
type SearchErrorAction = {
  type: 'SEARCH_ERROR';
  payload: string; // 에러 메시지
};

// 검색 결과 초기화
type ClearSearchResultsAction = {
  type: 'CLEAR_SEARCH_RESULTS';
};
```

#### B. 마커 관련 액션

```typescript
// 마커 로딩 시작
type LoadPlacesStartAction = {
  type: 'LOAD_PLACES_START';
};

// 마커 로딩 성공
type LoadPlacesSuccessAction = {
  type: 'LOAD_PLACES_SUCCESS';
  payload: PlaceMarker[];
};

// 마커 로딩 실패
type LoadPlacesErrorAction = {
  type: 'LOAD_PLACES_ERROR';
  payload: string; // 에러 메시지
};
```

#### C. 지도 관련 액션

```typescript
// 지도 중심 이동
type UpdateMapCenterAction = {
  type: 'UPDATE_MAP_CENTER';
  payload: { lat: number; lng: number };
};

// 지도 줌 변경
type UpdateMapZoomAction = {
  type: 'UPDATE_MAP_ZOOM';
  payload: number;
};
```

#### D. UI 관련 액션

```typescript
// 검색 배너 닫기
type CloseSearchBannerAction = {
  type: 'CLOSE_SEARCH_BANNER';
};

// 에러 스낵바 표시
type ShowErrorSnackbarAction = {
  type: 'SHOW_ERROR_SNACKBAR';
  payload: string; // 에러 메시지
};

// 에러 스낵바 숨김
type HideErrorSnackbarAction = {
  type: 'HIDE_ERROR_SNACKBAR';
};
```

#### E. 통합 액션 타입

```typescript
type MapAction =
  | UpdateSearchQueryAction
  | SearchStartAction
  | SearchSuccessAction
  | SearchErrorAction
  | ClearSearchResultsAction
  | LoadPlacesStartAction
  | LoadPlacesSuccessAction
  | LoadPlacesErrorAction
  | UpdateMapCenterAction
  | UpdateMapZoomAction
  | CloseSearchBannerAction
  | ShowErrorSnackbarAction
  | HideErrorSnackbarAction;
```

### 3.3. Reducer 설계

```typescript
type MapState = {
  // 지도 상태
  center: { lat: number; lng: number };
  zoom: number;

  // 검색 상태
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  searchError: string | null;

  // 마커 상태
  places: PlaceMarker[];
  isLoadingPlaces: boolean;
  placesError: string | null;

  // UI 상태
  showSearchResultBanner: boolean;
  errorSnackbar: { message: string; visible: boolean } | null;
};

const initialState: MapState = {
  center: { lat: 37.5665, lng: 126.9780 }, // 서울시청
  zoom: 13,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  searchError: null,
  places: [],
  isLoadingPlaces: false,
  placesError: null,
  showSearchResultBanner: false,
  errorSnackbar: null,
};

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'UPDATE_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
        searchError: null, // 새 입력 시 에러 초기화
      };

    case 'SEARCH_START':
      return {
        ...state,
        isSearching: true,
        searchError: null,
      };

    case 'SEARCH_SUCCESS':
      return {
        ...state,
        isSearching: false,
        searchResults: action.payload.results,
        center: action.payload.center,
        zoom: action.payload.zoom,
        showSearchResultBanner: true,
        searchError: null,
      };

    case 'SEARCH_ERROR':
      return {
        ...state,
        isSearching: false,
        searchResults: [],
        searchError: action.payload,
        showSearchResultBanner: false,
        errorSnackbar: {
          message: action.payload,
          visible: true,
        },
      };

    case 'CLEAR_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: [],
        showSearchResultBanner: false,
        searchError: null,
      };

    case 'LOAD_PLACES_START':
      return {
        ...state,
        isLoadingPlaces: true,
        placesError: null,
      };

    case 'LOAD_PLACES_SUCCESS':
      return {
        ...state,
        isLoadingPlaces: false,
        places: action.payload,
        placesError: null,
      };

    case 'LOAD_PLACES_ERROR':
      return {
        ...state,
        isLoadingPlaces: false,
        places: [],
        placesError: action.payload,
        errorSnackbar: {
          message: action.payload,
          visible: true,
        },
      };

    case 'UPDATE_MAP_CENTER':
      return {
        ...state,
        center: action.payload,
      };

    case 'UPDATE_MAP_ZOOM':
      return {
        ...state,
        zoom: action.payload,
      };

    case 'CLOSE_SEARCH_BANNER':
      return {
        ...state,
        showSearchResultBanner: false,
      };

    case 'SHOW_ERROR_SNACKBAR':
      return {
        ...state,
        errorSnackbar: {
          message: action.payload,
          visible: true,
        },
      };

    case 'HIDE_ERROR_SNACKBAR':
      return {
        ...state,
        errorSnackbar: null,
      };

    default:
      return state;
  }
}
```

### 3.4. View 단계 (컴포넌트 예시)

#### A. SearchBar 컴포넌트
```typescript
function SearchBar() {
  const { state, dispatch, handleSearch } = useMapContext();

  const onInputChange = (value: string) => {
    dispatch({ type: 'UPDATE_SEARCH_QUERY', payload: value });
  };

  const onSearchSubmit = () => {
    handleSearch(state.searchQuery);
  };

  return (
    <div>
      <input
        value={state.searchQuery}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
        placeholder="장소를 검색하세요"
      />
      <button onClick={onSearchSubmit} disabled={state.isSearching}>
        {state.isSearching ? '검색 중...' : '검색'}
      </button>
    </div>
  );
}
```

#### B. SearchResultBanner 컴포넌트
```typescript
function SearchResultBanner() {
  const { state, dispatch } = useMapContext();

  if (!state.showSearchResultBanner || state.searchResults.length === 0) {
    return null;
  }

  return (
    <div className="search-result-banner">
      <button onClick={() => dispatch({ type: 'CLOSE_SEARCH_BANNER' })}>
        ✕
      </button>
      {state.searchResults.map((result) => (
        <SearchResultItem key={result.externalId} result={result} />
      ))}
    </div>
  );
}
```

#### C. MapView 컴포넌트
```typescript
function MapView() {
  const { state, dispatch } = useMapContext();

  const onCenterChange = (center: { lat: number; lng: number }) => {
    dispatch({ type: 'UPDATE_MAP_CENTER', payload: center });
  };

  const onZoomChange = (zoom: number) => {
    dispatch({ type: 'UPDATE_MAP_ZOOM', payload: zoom });
  };

  return (
    <NaverMap
      center={state.center}
      zoom={state.zoom}
      onCenterChanged={onCenterChange}
      onZoomChanged={onZoomChange}
    >
      {state.places.map((place) => (
        <Marker
          key={place.id}
          position={{ lat: place.latitude, lng: place.longitude }}
          onClick={() => navigateTo(`/place/${place.id}`)}
        />
      ))}
    </NaverMap>
  );
}
```

---

## 4. Context + useReducer 설계

### 4.1. 데이터 로딩 플로우

```
┌─────────────────────────────────────────────────────────────┐
│                      MapProvider 마운트                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │ useEffect(() => {        │
              │   loadPlaces();          │
              │ }, []);                  │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │ dispatch({               │
              │   type:                  │
              │   'LOAD_PLACES_START'    │
              │ })                       │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │ GET /api/places          │
              │ ?hasReviews=true         │
              └──────────────────────────┘
                            │
                ┌───────────┴────────────┐
                ▼                        ▼
    ┌───────────────────┐    ┌───────────────────┐
    │  성공 (200 OK)    │    │   실패 (에러)     │
    └───────────────────┘    └───────────────────┘
                │                        │
                ▼                        ▼
    ┌───────────────────┐    ┌───────────────────┐
    │ dispatch({        │    │ dispatch({        │
    │   type:           │    │   type:           │
    │   'LOAD_PLACES_   │    │   'LOAD_PLACES_   │
    │   SUCCESS',       │    │   ERROR',         │
    │   payload: [...]  │    │   payload: "..."  │
    │ })                │    │ })                │
    └───────────────────┘    └───────────────────┘
                │                        │
                ▼                        ▼
    ┌───────────────────┐    ┌───────────────────┐
    │ 지도에 마커 표시  │    │ 에러 스낵바 표시  │
    └───────────────────┘    └───────────────────┘
```

### 4.2. 검색 플로우

```
┌─────────────────────────────────────────────────────────────┐
│            사용자가 검색어 입력 후 Enter 또는 클릭            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │ 클라이언트 측 유효성 검증 │
              │ - 빈 값 체크             │
              │ - 길이 체크 (2-50자)     │
              └──────────────────────────┘
                            │
                ┌───────────┴────────────┐
                ▼                        ▼
    ┌───────────────────┐    ┌───────────────────┐
    │   유효성 통과     │    │   유효성 실패     │
    └───────────────────┘    └───────────────────┘
                │                        │
                ▼                        ▼
    ┌───────────────────┐    ┌───────────────────┐
    │ dispatch({        │    │ 에러 메시지 표시  │
    │   type:           │    │ (인라인 피드백)   │
    │   'SEARCH_START'  │    └───────────────────┘
    │ })                │
    └───────────────────┘
                │
                ▼
    ┌───────────────────┐
    │ GET /api/search   │
    │ ?query=...        │
    └───────────────────┘
                │
    ┌───────────┴────────────────────┐
    ▼                                ▼
┌───────────────┐          ┌─────────────────┐
│ 성공 (200 OK) │          │  실패 (에러)    │
└───────────────┘          └─────────────────┘
    │                                │
    ▼                                ▼
┌───────────────┐          ┌─────────────────┐
│ results.length│          │ dispatch({      │
│ > 0 ?         │          │   type:         │
└───────────────┘          │   'SEARCH_ERROR'│
    │                      │   payload: "..."│
┌───┴────┐                 │ })              │
▼        ▼                 └─────────────────┘
예      아니오                      │
│        │                          ▼
│        │              ┌─────────────────┐
│        │              │ 에러 스낵바 표시│
│        │              └─────────────────┘
│        ▼
│  ┌───────────────┐
│  │ dispatch({    │
│  │   type:       │
│  │   'SEARCH_    │
│  │   SUCCESS',   │
│  │   payload: {  │
│  │     results:[]│
│  │   }           │
│  │ })            │
│  └───────────────┘
│        │
│        ▼
│  ┌───────────────┐
│  │ "검색 결과가  │
│  │ 없습니다"     │
│  │ 메시지 표시   │
│  └───────────────┘
│
▼
┌───────────────┐
│ dispatch({    │
│   type:       │
│   'SEARCH_    │
│   SUCCESS',   │
│   payload: {  │
│     results,  │
│     center,   │
│     zoom      │
│   }           │
│ })            │
└───────────────┘
    │
    ▼
┌───────────────┐
│ 지도 이동 +   │
│ 검색 결과     │
│ 배너 표시     │
└───────────────┘
```

### 4.3. Context 구조

```typescript
// MapContext.tsx

type MapContextValue = {
  // 상태
  state: MapState;

  // Dispatch
  dispatch: React.Dispatch<MapAction>;

  // 헬퍼 함수 (복잡한 액션 로직을 캡슐화)
  handleSearch: (query: string) => Promise<void>;
  loadPlaces: () => Promise<void>;
  navigateToPlace: (placeId: string) => void;
  closeSearchBanner: () => void;
  hideErrorSnackbar: () => void;
};

const MapContext = createContext<MapContextValue | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(mapReducer, initialState);

  // 마커 로딩 함수
  const loadPlaces = async () => {
    dispatch({ type: 'LOAD_PLACES_START' });

    try {
      const response = await fetch('/api/places?hasReviews=true');
      if (!response.ok) throw new Error('Failed to fetch places');

      const data = await response.json();
      dispatch({ type: 'LOAD_PLACES_SUCCESS', payload: data.places });
    } catch (error) {
      dispatch({
        type: 'LOAD_PLACES_ERROR',
        payload: '장소 정보를 불러오는 데 실패했습니다.',
      });
    }
  };

  // 검색 함수
  const handleSearch = async (query: string) => {
    // 유효성 검증
    if (query.trim().length < 2) {
      dispatch({
        type: 'SEARCH_ERROR',
        payload: '검색어는 최소 2자 이상이어야 합니다.',
      });
      return;
    }

    if (query.length > 50) {
      dispatch({
        type: 'SEARCH_ERROR',
        payload: '검색어는 최대 50자까지 입력 가능합니다.',
      });
      return;
    }

    dispatch({ type: 'SEARCH_START' });

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search API failed');

      const data = await response.json();

      if (data.data.length === 0) {
        dispatch({
          type: 'SEARCH_ERROR',
          payload: '검색 결과가 없습니다. 다른 키워드로 검색해주세요.',
        });
        return;
      }

      // 검색 결과의 중심 좌표 계산 (첫 번째 결과 기준)
      const firstResult = data.data[0];
      const center = {
        lat: firstResult.latitude,
        lng: firstResult.longitude,
      };

      dispatch({
        type: 'SEARCH_SUCCESS',
        payload: {
          results: data.data,
          center,
          zoom: 15,
        },
      });
    } catch (error) {
      dispatch({
        type: 'SEARCH_ERROR',
        payload: '검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      });
    }
  };

  // 장소 상세 페이지로 이동
  const navigateToPlace = (placeId: string) => {
    window.location.href = `/place/${placeId}`;
  };

  // 검색 배너 닫기
  const closeSearchBanner = () => {
    dispatch({ type: 'CLOSE_SEARCH_BANNER' });
  };

  // 에러 스낵바 숨김
  const hideErrorSnackbar = () => {
    dispatch({ type: 'HIDE_ERROR_SNACKBAR' });
  };

  // 페이지 마운트 시 마커 로딩
  useEffect(() => {
    loadPlaces();
  }, []);

  // 에러 스낵바 자동 소멸 (5초)
  useEffect(() => {
    if (state.errorSnackbar?.visible) {
      const timer = setTimeout(() => {
        hideErrorSnackbar();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.errorSnackbar]);

  const value: MapContextValue = {
    state,
    dispatch,
    handleSearch,
    loadPlaces,
    navigateToPlace,
    closeSearchBanner,
    hideErrorSnackbar,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within MapProvider');
  }
  return context;
}
```

---

## 5. 노출 인터페이스 (TypeScript 타입)

### 5.1. 상태 타입

```typescript
// 검색 결과 아이템
export type SearchResult = {
  name: string;           // 장소명 (HTML 태그 제거됨)
  address: string;        // 지번 주소
  roadAddress: string;    // 도로명 주소
  category: string;       // 업종
  latitude: number;       // 위도 (WGS84)
  longitude: number;      // 경도 (WGS84)
  externalId: string;     // Naver 장소 링크
};

// 장소 마커 (DB에서 조회된 데이터)
export type PlaceMarker = {
  id: string;             // UUID (DB Primary Key)
  name: string;           // 장소명
  latitude: number;       // 위도
  longitude: number;      // 경도
  averageRating: number;  // 평균 평점 (0.0 ~ 5.0)
  reviewCount: number;    // 리뷰 개수
};

// 지도 중심 좌표
export type MapCenter = {
  lat: number;            // 위도
  lng: number;            // 경도
};

// 에러 스낵바
export type ErrorSnackbar = {
  message: string;        // 에러 메시지
  visible: boolean;       // 표시 여부
};

// 전체 상태
export type MapState = {
  // 지도 상태
  center: MapCenter;
  zoom: number;

  // 검색 상태
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  searchError: string | null;

  // 마커 상태
  places: PlaceMarker[];
  isLoadingPlaces: boolean;
  placesError: string | null;

  // UI 상태
  showSearchResultBanner: boolean;
  errorSnackbar: ErrorSnackbar | null;
};
```

### 5.2. Context 노출 인터페이스

```typescript
export type MapContextValue = {
  // ===== 상태 (읽기 전용) =====
  state: MapState;

  // ===== 저수준 Dispatch (고급 사용) =====
  dispatch: React.Dispatch<MapAction>;

  // ===== 고수준 헬퍼 함수 (권장) =====

  /**
   * 장소를 검색합니다.
   * @param query - 검색 키워드 (2-50자)
   * @throws 유효성 검증 실패 시 SEARCH_ERROR 액션 dispatch
   */
  handleSearch: (query: string) => Promise<void>;

  /**
   * 리뷰가 있는 장소 목록을 로딩합니다.
   * 페이지 마운트 시 자동으로 호출됩니다.
   */
  loadPlaces: () => Promise<void>;

  /**
   * 특정 장소의 상세 페이지로 이동합니다.
   * @param placeId - 장소 UUID
   */
  navigateToPlace: (placeId: string) => void;

  /**
   * 검색 결과 배너를 닫습니다.
   */
  closeSearchBanner: () => void;

  /**
   * 에러 스낵바를 수동으로 숨깁니다.
   * (5초 후 자동으로 숨겨지지만, 사용자가 수동으로 닫을 수도 있음)
   */
  hideErrorSnackbar: () => void;
};
```

### 5.3. 컴포넌트 사용 예시

```typescript
// SearchBar.tsx
function SearchBar() {
  const { state, handleSearch } = useMapContext();
  const [localQuery, setLocalQuery] = useState('');

  // 디바운싱 적용
  const debouncedSearch = useDebouncedCallback(
    (query: string) => {
      handleSearch(query);
    },
    500
  );

  return (
    <div>
      <input
        value={localQuery}
        onChange={(e) => {
          setLocalQuery(e.target.value);
          debouncedSearch(e.target.value);
        }}
        placeholder="장소를 검색하세요"
      />
      {state.isSearching && <Spinner />}
      {state.searchError && <ErrorText>{state.searchError}</ErrorText>}
    </div>
  );
}

// MapView.tsx
function MapView() {
  const { state, navigateToPlace } = useMapContext();

  return (
    <NaverMap center={state.center} zoom={state.zoom}>
      {state.places.map((place) => (
        <Marker
          key={place.id}
          position={{ lat: place.latitude, lng: place.longitude }}
          onClick={() => navigateToPlace(place.id)}
        />
      ))}
    </NaverMap>
  );
}

// SearchResultBanner.tsx
function SearchResultBanner() {
  const { state, closeSearchBanner } = useMapContext();

  if (!state.showSearchResultBanner) return null;

  return (
    <div>
      <button onClick={closeSearchBanner}>✕</button>
      {state.searchResults.map((result) => (
        <SearchResultItem key={result.externalId} result={result} />
      ))}
    </div>
  );
}

// ErrorSnackbar.tsx
function ErrorSnackbar() {
  const { state, hideErrorSnackbar } = useMapContext();

  if (!state.errorSnackbar?.visible) return null;

  return (
    <div className="snackbar" role="alert">
      <p>{state.errorSnackbar.message}</p>
      <button onClick={hideErrorSnackbar}>닫기</button>
    </div>
  );
}
```

---

## 6. 성능 최적화 전략

### 6.1. 메모이제이션
- `useMemo`를 사용하여 파생 데이터 계산 최적화:
  ```typescript
  const hasSearchResults = useMemo(
    () => state.searchResults.length > 0,
    [state.searchResults]
  );
  ```

### 6.2. 디바운싱
- 검색 입력에 0.5초 디바운싱 적용 (react-use의 `useDebouncedCallback` 사용)

### 6.3. 조건부 렌더링
- `showSearchResultBanner`, `errorSnackbar.visible` 등을 활용한 불필요한 렌더링 방지

### 6.4. React Query 통합 (선택사항)
- `loadPlaces` 함수를 React Query의 `useQuery`로 대체 가능:
  ```typescript
  const { data: places, isLoading, error } = useQuery({
    queryKey: ['places', 'hasReviews'],
    queryFn: () => fetch('/api/places?hasReviews=true').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5분 캐싱
  });
  ```

---

## 7. 테스트 전략

### 7.1. Reducer 단위 테스트
```typescript
describe('mapReducer', () => {
  it('should handle SEARCH_START', () => {
    const state = { ...initialState };
    const action = { type: 'SEARCH_START' };
    const nextState = mapReducer(state, action);
    expect(nextState.isSearching).toBe(true);
  });

  it('should handle SEARCH_SUCCESS', () => {
    const state = { ...initialState, isSearching: true };
    const action = {
      type: 'SEARCH_SUCCESS',
      payload: {
        results: [mockSearchResult],
        center: { lat: 37.5, lng: 127.0 },
        zoom: 15,
      },
    };
    const nextState = mapReducer(state, action);
    expect(nextState.isSearching).toBe(false);
    expect(nextState.searchResults).toHaveLength(1);
    expect(nextState.showSearchResultBanner).toBe(true);
  });
});
```

### 7.2. 컴포넌트 통합 테스트
```typescript
describe('SearchBar', () => {
  it('should call handleSearch when Enter is pressed', async () => {
    const handleSearch = jest.fn();
    render(
      <MapContext.Provider value={{ state, handleSearch, ... }}>
        <SearchBar />
      </MapContext.Provider>
    );

    const input = screen.getByPlaceholderText('장소를 검색하세요');
    fireEvent.change(input, { target: { value: '강남역' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(handleSearch).toHaveBeenCalledWith('강남역');
    });
  });
});
```

---

## 8. 참조

### 8.1. 관련 문서
- `/docs/pages/main/requirement.md` - 페이지 요구사항
- `/docs/prd.md` - 제품 요구사항 정의서
- `/docs/userflow.md` - 유저 플로우
- `/docs/usecases/001/spec.md` - 장소 검색 유스케이스
- `/docs/usecases/005/spec.md` - 장소 상세 조회 유스케이스

### 8.2. 라이브러리
- `react-naver-maps`: Naver Maps React 래퍼
- `react-use`: `useDebouncedCallback` 등 유틸리티 훅
- `@tanstack/react-query`: 서버 상태 관리 (선택사항)
- `zustand`: 전역 상태 관리 (Context 대신 사용 가능, 선택사항)

---

## 9. 구현 시 주의사항

1. **타입 안전성**: 모든 액션과 상태는 TypeScript로 엄격하게 타이핑합니다.
2. **에러 핸들링**: 모든 비동기 작업에 try-catch를 적용하고, 사용자에게 명확한 피드백을 제공합니다.
3. **접근성**: 에러 메시지에 `role="alert"`, 로딩 상태에 `aria-busy` 등을 사용합니다.
4. **보안**: `NCP_CLIENT_SECRET`은 절대 클라이언트에 노출하지 않습니다. (모든 Naver API 호출은 백엔드 경유)
5. **성능**: 디바운싱, 메모이제이션, 조건부 렌더링을 적극 활용합니다.
6. **유지보수성**: Reducer는 순수 함수로 유지하고, 부수 효과는 Context Provider의 헬퍼 함수에서 처리합니다.
