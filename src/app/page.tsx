"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useSearchQuery } from "@/features/search/hooks/useSearchQuery";
import { useDebounce } from "@/features/search/hooks/useDebounce";
import { SearchBar } from "@/features/search/components/search-bar";
import { SearchResultBanner } from "@/features/search/components/search-result-banner";
import { Loader2 } from "lucide-react";

// 지도 컴포넌트를 동적으로 로드 (SSR 비활성화)
const NaverMapComponent = dynamic(
  () => import("@/features/map/components/naver-map").then((mod) => mod.NaverMapComponent),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 flex items-center justify-center bg-muted rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export default function Home() {
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const debouncedQuery = useDebounce(searchQuery, 500);
  const { data: searchResults, isLoading, error } = useSearchQuery(debouncedQuery);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-4xl py-6">
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">위치 기반 맛집 리뷰</h1>
            <p className="text-muted-foreground mt-2">
              지도에서 맛집을 찾고, 리뷰를 공유하세요
            </p>
          </div>

          {/* 지도 */}
          <div className="bg-white rounded-lg p-4">
            <NaverMapComponent />
          </div>

          {/* 검색 바 */}
          <SearchBar onSearch={handleSearch} placeholder="음식점이나 지역을 검색해보세요..." />

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
            >
              검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요
            </div>
          )}

          {/* 검색 결과 */}
          {searchResults && !isLoading && (
            <SearchResultBanner results={searchResults.results} />
          )}
        </div>
      </div>
    </main>
  );
}
