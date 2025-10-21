'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SearchResult } from '../lib/dto';

interface SearchResultBannerProps {
  results: SearchResult[];
}

export function SearchResultBanner({ results }: SearchResultBannerProps) {
  if (results.length === 0) {
    return (
      <div
        role="alert"
        className="text-center py-8 text-muted-foreground"
      >
        검색 결과가 없습니다. 다른 키워드로 검색해주세요
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result, idx) => (
        <Card key={`${result.name}-${idx}`} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <CardTitle className="text-lg">{result.name}</CardTitle>
                <CardDescription className="mt-1">{result.address}</CardDescription>
              </div>
              <Badge variant="outline">{result.category}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Link
              href={`/write?placeId=${encodeURIComponent(result.name)}&placeName=${encodeURIComponent(result.name)}&placeInfo=${encodeURIComponent(JSON.stringify({
                name: result.name,
                address: result.address,
                category: result.category,
                latitude: result.latitude,
                longitude: result.longitude,
              }))}`}
            >
              <Button className="w-full" variant="default">
                리뷰 작성하기
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
