네, 알겠습니다.
지금까지 조사하고 확정한 내용을 바탕으로, Next.js 프로젝트 연동을 위한 최종 기술 문서를 작성했습니다.

-----

## Next.js 맛집 리뷰 사이트: 네이버 연동 기술 최종 문서

본 문서는 Next.js(App Router, v14+ 기준) 풀스택 프로젝트에 네이버의 지도 및 검색 기능을 연동하는 방법을 정의합니다.

### 1\. 연동 수단 요약

프로젝트 요구사항(PRD)을 충족하기 위해 **1개의 SDK**와 **1개의 API**를 연동합니다. Webhook은 사용하지 않습니다.

  * **SDK (클라이언트):** Naver Maps JavaScript SDK
  * **API (서버):** Naver Search API (Local)
  * **Webhook:** 연동 불필요
      * **사유:** 본 프로젝트는 네이버의 리뷰 시스템을 연동하는 것이 아닌, 자체 데이터베이스(DB)에 리뷰를 저장, 수정, 삭제(Flow 2, 3, 4)하는 독립적인 시스템입니다. 따라서 네이버 측에서 우리 서버로 이벤트를 통지(push)할 필요가 없습니다.

-----

### 2\. (SDK) Naver Maps JavaScript SDK

지도 UI 렌더링, 마커 표시 등 브라우저(클라이언트)에서의 모든 시각적 상호작용을 담당합니다.

#### 2.1. 사용할 기능

  * **지도 렌더링:** 메인 페이지에 기본 지도를 표시합니다.
  * **마커 표시:** (Flow 5) 우리 DB에 저장된 (리뷰가 1개 이상인) 장소들의 좌표를 가져와 지도 위에 마커를 표시합니다.
  * **마커 이벤트 처리:** (Flow 5) 사용자가 특정 마커를 클릭하면, 해당 장소의 상세 페이지(`/place/[placeId]`)로 이동시킵니다.
  * **지도 뷰 제어:** (Flow 1) '장소 검색' API 호출 완료 시, 검색된 좌표로 지도의 중심점을 이동(pan)시킵니다.

#### 2.2. 설치 및 세팅 방법

  * **설치:** 별도 라이브러리 설치 없이 네이티브 Naver Maps JavaScript API를 직접 사용합니다.
    ```bash
    # 타입스크립트 사용 시 (권장)
    npm install --save-dev @types/navermaps
    ```
  * **세팅:** 프로젝트 최상단(예: `/app/layout.tsx`)에서 Script 태그로 Naver Maps SDK를 로드합니다.
    ```tsx
    // /app/layout.tsx
    import Script from "next/script";

    export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
        <html lang="ko" suppressHydrationWarning>
          <head>
            <Script
              strategy="beforeInteractive"
              src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NCP_CLIENT_ID}`}
            />
          </head>
          <body className="antialiased font-sans" suppressHydrationWarning>
            {children}
          </body>
        </html>
      );
    }
    ```
  * **타입 정의:** `src/types/naver-maps.d.ts` 파일에 전역 타입을 정의합니다.
    ```typescript
    // src/types/naver-maps.d.ts
    declare global {
      interface Window {
        naver: typeof naver;
      }
    }

    export {};
    ```

#### 2.3. 인증정보 관리 방법

  * **필요 정보:** `Client ID`
  * **관리:** Client ID는 브라우저에 노출되어야 합니다. Next.js 환경 변수 파일(`.env.local`)에 `NEXT_PUBLIC_` 접두사를 붙여 저장합니다.
    ```env
    # .env.local
    NEXT_PUBLIC_NCP_CLIENT_ID=...NCP에서_발급받은_Client_ID...
    ```

#### 2.4. 호출 방법

  * 지도가 필요한 컴포넌트를 `'use client'`로 선언하고 네이티브 `window.naver.maps` API를 사용합니다.
  * **주의:** 스크립트 로딩 완료를 확인한 후 지도를 초기화해야 합니다.
    
    ```tsx
    // /features/map/components/naver-map.tsx
    'use client';

    import { useRouter } from 'next/navigation';
    import { useEffect, useState } from 'react';
    import { useQuery } from '@tanstack/react-query';
    import { Loader2 } from 'lucide-react';
    import { apiClient } from '@/lib/remote/api-client';

    interface Place {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      average_rating: number;
      review_count: number;
    }

    export function NaverMapComponent() {
      const router = useRouter();
      const [isMounted, setIsMounted] = useState(false);
      const [isMapLoaded, setIsMapLoaded] = useState(false);

      useEffect(() => {
        setIsMounted(true);
        
        // 네이버 지도 스크립트 로드 확인
        const checkNaverMaps = () => {
          if (typeof window !== 'undefined' && window.naver && window.naver.maps) {
            setIsMapLoaded(true);
          } else {
            setTimeout(checkNaverMaps, 100);
          }
        };
        
        checkNaverMaps();
      }, []);

      // 리뷰가 있는 모든 장소 조회
      const { data: places = [], isLoading } = useQuery({
        queryKey: ['places-with-reviews'],
        queryFn: async () => {
          try {
            const response = await apiClient.get('/api/places');
            return response.data.data || [];
          } catch {
            return [];
          }
        },
        staleTime: 5 * 60 * 1000, // 5분 캐시
        enabled: isMounted && isMapLoaded,
      });

      if (!isMounted || !isMapLoaded) {
        return (
          <div className="w-full h-96 flex items-center justify-center bg-muted rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        );
      }

      return <NaverMapContent places={places} isLoading={isLoading} router={router} />;
    }

    function NaverMapContent({ 
      places, 
      isLoading, 
      router 
    }: { 
      places: Place[]; 
      isLoading: boolean; 
      router: ReturnType<typeof useRouter>;
    }) {
      const [map, setMap] = useState<naver.maps.Map | null>(null);
      const [markers, setMarkers] = useState<naver.maps.Marker[]>([]);

      useEffect(() => {
        if (!window.naver || !window.naver.maps) return;

        const mapDiv = document.getElementById('naverMap');
        if (!mapDiv) return;

        // 지도 생성
        const defaultCenter = new window.naver.maps.LatLng(37.5665, 126.978);
        const newMap = new window.naver.maps.Map(mapDiv, {
          center: defaultCenter,
          zoom: 11,
        });

        setMap(newMap);

        return () => {
          // 클린업
          markers.forEach(marker => marker.setMap(null));
          setMarkers([]);
        };
      }, []);

      useEffect(() => {
        if (!map || !window.naver || !window.naver.maps) return;

        // 기존 마커 제거
        markers.forEach(marker => marker.setMap(null));

        // 새 마커 생성
        const newMarkers = places.map((place) => {
          const marker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(place.latitude, place.longitude),
            map: map,
            title: place.name,
          });

          // (Flow 5) 마커 클릭 시 상세 페이지 이동
          window.naver.maps.Event.addListener(marker, 'click', () => {
            router.push(`/place/${place.id}`);
          });

          return marker;
        });

        setMarkers(newMarkers);
      }, [map, places, router]);

      return (
        <div className="w-full space-y-4">
          <div id="naverMap" style={{ width: '100%', height: '400px' }} className="rounded-lg overflow-hidden" />

          {/* 장소 목록 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : places.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {places.slice(0, 6).map((place) => (
                <button
                  key={place.id}
                  onClick={() => router.push(`/place/${place.id}`)}
                  className="text-left p-3 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="font-semibold text-foreground">{place.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ⭐ {place.average_rating.toFixed(1)} ({place.review_count}개 리뷰)
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-8">
              아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!
            </div>
          )}
        </div>
      );
    }
    ```

-----

### 3\. (API) Naver Search API (Local)

사용자가 키워드로 장소를 검색(Flow 1)하고, 우리 DB에 없는 새로운 장소 정보를 가져오기 위해 서버에서 호출합니다.

#### 3.1. 사용할 기능

  * **장소 검색:** (Flow 1) 사용자가 입력한 키워드(예: "강남역 파스타")를 `query` 파라미터로 전송하여, 네이버에 등록된 장소 목록(이름, 주소, 좌표)을 `JSON` 형태로 받아옵니다.
  * **데이터 활용:** (Flow 1, 2)
    1.  검색 직후: 클라이언트에 배너 형태로 정보를 표시합니다.
    2.  리뷰 작성 시: 해당 장소 정보를 **우리 DB에 저장**합니다 (사용자 질문 1번 답변 반영).

#### 3.2. 설치 및 세팅 방법

  * **설치:** 별도 라이브러리가 필요 없으며, Next.js의 내장 `fetch` API를 사용합니다.
  * **세팅:** 클라이언트의 요청을 받아 서버에서 네이버로 API를 중계(proxy)할 **API Route**를 생성합니다.
      * 파일 경로: `/app/api/search/route.ts`

#### 3.3. 인증정보 관리 방법

  * **필요 정보:** `Client ID`, `Client Secret`
  * **관리:** `Client Secret`은 **절대 브라우저에 노출되면 안 되는** 민감 정보입니다. `.env.local` 파일에 `NEXT_PUBLIC_` 접두사 **없이** 저장하여 서버 전용 변수로 관리합니다.
    ```env
    # .env.local

    # SDK용 (브라우저 노출 O)
    NEXT_PUBLIC_NCP_CLIENT_ID=...NCP에서_발급받은_Client_ID...

    # Search API용 (서버 전용, 브라우저 노출 X)
    NCP_CLIENT_SECRET=...NCP에서_발급받은_Client_Secret...
    ```

#### 3.4. 호출 방법

  * 호출은 2단계로 이루어집니다:

    1.  **[서버]** Hono API Route에서 Naver API를 호출 (Server-to-Server)
    2.  **[클라이언트]** React 컴포넌트에서 위 1번의 API Route를 호출 (Client-to-Server)

  * **1. [서버] Hono API Route 생성 (`/features/search/backend/route.ts`)**

    ```typescript
    import { Hono } from 'hono';
    import { searchPlaces } from './service';
    import { SearchQuerySchema } from './schema';
    import { SEARCH_ERRORS } from './error';
    import { respond, success, failure } from '@/backend/http/response';
    import { getConfig, getLogger, type AppEnv } from '@/backend/hono/context';

    export function registerSearchRoutes(app: Hono<AppEnv>) {
      app.get('/api/search', async (c) => {
        const logger = getLogger(c);
        const config = getConfig(c);

        try {
          const query = c.req.query('query');

          if (!query) {
            const result = failure(
              400,
              SEARCH_ERRORS.SEARCH_QUERY_REQUIRED.code,
              SEARCH_ERRORS.SEARCH_QUERY_REQUIRED.message
            );
            return respond(c, result);
          }

          // 쿼리 유효성 검증
          const queryValidation = SearchQuerySchema.safeParse(query);
          if (!queryValidation.success) {
            const result = failure(
              400,
              SEARCH_ERRORS.SEARCH_QUERY_INVALID.code,
              SEARCH_ERRORS.SEARCH_QUERY_INVALID.message
            );
            return respond(c, result);
          }

          // 검색 서비스 호출
          const searchResult = await searchPlaces(query, {
            clientId: config.naverClientId,
            clientSecret: config.naverClientSecret,
          });

          if (!searchResult.success) {
            const error = searchResult.error!;
            const result = failure(error.statusCode as any, error.code, error.message);
            return respond(c, result);
          }

          const result = success(searchResult.data, 200);
          return respond(c, result);
        } catch (error) {
          logger.error('Search error:', error);
          const result = failure(
            500,
            SEARCH_ERRORS.SEARCH_API_ERROR.code,
            SEARCH_ERRORS.SEARCH_API_ERROR.message
          );
          return respond(c, result);
        }
      });
    }
    ```

  * **2. [서버] 검색 서비스 로직 (`/features/search/backend/service.ts`)**

    ```typescript
    import { createNaverSearchClient } from '@/lib/external/naver-client';
    import { SearchQuerySchema, SearchResponseSchema } from './schema';
    import { SEARCH_ERRORS } from './error';

    export async function searchPlaces(
      query: string,
      config: { clientId: string; clientSecret: string }
    ) {
      const queryValidation = SearchQuerySchema.safeParse(query);
      if (!queryValidation.success) {
        return {
          success: false,
          error: SEARCH_ERRORS.SEARCH_QUERY_INVALID,
          data: null,
        };
      }

      const validatedQuery = queryValidation.data;

      try {
        const client = createNaverSearchClient(config.clientId, config.clientSecret);
        const results = await client.search(validatedQuery, 5);

        if (results.length === 0) {
          return {
            success: true,
            error: null,
            data: {
              results: [],
              total: 0,
            },
          };
        }

        const responseValidation = SearchResponseSchema.safeParse({
          results,
          total: results.length,
        });

        if (!responseValidation.success) {
          console.error('Response validation failed:', {
            errors: responseValidation.error.errors,
            results: JSON.stringify(results, null, 2),
          });
          return {
            success: false,
            error: SEARCH_ERRORS.SEARCH_RESPONSE_INVALID,
            data: null,
          };
        }

        return {
          success: true,
          error: null,
          data: responseValidation.data,
        };
      } catch (error) {
        return {
          success: false,
          error: SEARCH_ERRORS.SEARCH_API_ERROR,
          data: null,
        };
      }
    }
    ```

  * **3. [클라이언트] 검색 컴포넌트에서 호출 (`/features/search/components/search-input.tsx`)**

    ```tsx
    'use client';
    import { useState } from 'react';
    import { useSearchQuery } from '../hooks/useSearchQuery';
    import { Input } from '@/components/ui/input';
    import { Button } from '@/components/ui/button';
    import { Search, Loader2 } from 'lucide-react';

    export function SearchInput() {
      const [query, setQuery] = useState('');
      const { mutate: search, data, isPending } = useSearchQuery();

      const handleSearch = () => {
        if (query.trim().length >= 2) {
          search(query);
        }
      };

      const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleSearch();
        }
      };

      return (
        <div className="w-full space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="장소를 검색하세요 (예: 강남역 맛집)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isPending || query.trim().length < 2}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* 검색 결과(배너) 렌더링 */}
          {data && data.results.length > 0 && (
            <div className="space-y-2">
              {data.results.map((item) => (
                <div key={item.link} className="p-3 border rounded-lg hover:bg-muted">
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">{item.address}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                  {/* (Flow 1) 리뷰 작성 버튼 */}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    ```