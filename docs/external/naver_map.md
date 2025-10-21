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

  * **설치:** React(Next.js) 환경에서는 `react-naver-maps` 래퍼(wrapper) 라이브러리 사용을 권장합니다.
    ```bash
    # 1. 메인 라이브러리 (필수)
    npm install react-naver-maps

    # 2. 타입스크립트 사용 시 (권장)
    npm install --save-dev @types/navermaps
    ```
  * **세팅:** 프로젝트 최상단(예: `/app/layout.tsx`)에서 `NavermapsProvider`로 `children`을 감싸 앱 전체에 SDK를 적용합니다.
    ```tsx
    // /app/layout.tsx
    import { NavermapsProvider } from 'react-naver-maps';

    export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
        <html lang="ko">
          <body>
            <NavermapsProvider
              ncpClientId={process.env.NEXT_PUBLIC_NCP_CLIENT_ID!}
            >
              {children}
            </NavermapsProvider>
          </body>
        </html>
      );
    }
    ```

#### 2.3. 인증정보 관리 방법

  * **필요 정보:** `Client ID`
  * **관리:** Client ID는 브라우저에 노출되어야 합니다. Next.js 환경 변수 파일(`.env.local`)에 `NEXT_PUBLIC_` 접두사를 붙여 저장합니다.
    ```env
    # .env.local
    NEXT_PUBLIC_NCP_CLIENT_ID=...NCP에서_발급받은_Client_ID...
    ```

#### 2.4. 호출 방법

  * 지도가 필요한 컴포넌트를 `'use client'`로 선언하고 `useNavermaps`, `NaverMap`, `Marker` 등을 사용합니다.
    ```tsx
    // /app/components/MyMap.tsx
    'use client';

    import { Container as MapDiv, NaverMap, Marker, useNavermaps } from 'react-naver-maps';

    function MyMap() {
      const navermaps = useNavermaps(); // naver.maps 객체 접근

      return (
        <MapDiv style={{ width: '100%', height: '400px' }}>
          <NaverMap
            defaultCenter={new navermaps.LatLng(37.5666, 126.9780)} // 서울시청
            defaultZoom={15}
          >
            {/* (Flow 5) 마커 클릭 시 상세 페이지 이동 */}
            <Marker
              position={new navermaps.LatLng(37.5666, 126.9780)}
              onClick={() => {
                // router.push('/place/[placeId]') 등의 로직
                alert('마커 클릭됨!');
              }}
            />
          </NaverMap>
        </MapDiv>
      );
    }

    export default MyMap;
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

    1.  **[서버]** Next.js API Route에서 Naver API를 호출 (Server-to-Server)
    2.  **[클라이언트]** React 컴포넌트에서 위 1번의 API Route를 호출 (Client-to-Server)

  * **1. [서버] API Route 생성 (`/app/api/search/route.ts`)**

    ```typescript
    import { NextResponse } from 'next/server';

    // 클라이언트의 GET 요청을 처리 (예: /api/search?query=강남역)
    export async function GET(request: Request) {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('query');

      if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
      }

      const API_URL = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5`;

      try {
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            // 인증 정보 (환경 변수에서 로드)
            'X-Naver-Client-Id': process.env.NEXT_PUBLIC_NCP_CLIENT_ID!,
            'X-Naver-Client-Secret': process.env.NCP_CLIENT_SECRET!,
          },
          cache: 'no-store', // 검색 결과는 캐시하지 않음
        });

        if (!response.ok) {
          throw new Error(`Naver API Error: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data.items); // 클라이언트에 결과 반환

      } catch (error) {
        return NextResponse.json({ error: 'API call failed' }, { status: 500 });
      }
    }
    ```

  * **2. [클라이언트] 검색 컴포넌트에서 호출 (`/app/page.tsx` 등)**

    ```tsx
    'use client';
    import { useState } from 'react';

    function SearchComponent() {
      const [query, setQuery] = useState('');
      const [results, setResults] = useState([]);

      const handleSearch = async () => {
        // (중요) 네이버 API가 아닌, 우리 서버의 API Route를 호출
        const response = await fetch(`/api/search?query=${query}`); 
        const data = await response.json();
        
        // (Flow 1) 검색 결과를 상태에 저장하여 배너로 표시
        setResults(data); 
      };

      return (
        <div>
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
          <button onClick={handleSearch}>검색</button>
          
          {/* 검색 결과(배너) 렌더링 */}
          <div>
            {results.map((item: any) => (
              <div key={item.link}>
                <h4>{item.title.replace(/<[^>]*>?/g, "")}</h4>
                <p>{item.address}</p>
                {/* (Flow 1) 리뷰 작성 버튼 */}
              </div>
            ))}
          </div>
        </div>
      );
    }
    ```