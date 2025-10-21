'use client';

import { usePlaceDetailQuery } from '@/features/place/hooks/usePlaceDetailQuery';
import { PlaceHeader } from '@/features/place/components/place-header';
import { ReviewList } from '@/features/place/components/review-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';

interface PlacePageProps {
  params: Promise<{
    placeId: string;
  }>;
}

export default function PlacePage({ params }: PlacePageProps) {
  const resolvedParams = async () => {
    const p = await params;
    return p.placeId;
  };

  // placeId를 서버에서 처리할 수 없으므로 클라이언트에서 처리
  // 하지만 params가 Promise이므로 다른 방식으로 처리해야 함
  const [placeId, setPlaceId] = React.useState<string | null>(null);

  React.useEffect(() => {
    resolvedParams().then((id) => setPlaceId(id));
  }, []);

  const { data, isLoading, error } = usePlaceDetailQuery(placeId);

  return (
    <main className="container max-w-2xl py-6">
      <div className="space-y-6">
        {/* 뒤로가기 버튼 */}
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            돌아가기
          </Button>
        </Link>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
          >
            장소 정보를 불러올 수 없습니다
          </div>
        )}

        {/* 데이터 표시 */}
        {data && (
          <>
            {/* 장소 헤더 */}
            <PlaceHeader place={data.place} />

            {/* 리뷰 작성 버튼 */}
            <Link
              href={`/write?placeId=${placeId}&placeName=${encodeURIComponent(data.place.name)}`}
            >
              <Button className="w-full" variant="default">
                리뷰 작성하기
              </Button>
            </Link>

            {/* 리뷰 목록 */}
            <ReviewList reviews={data.reviews} placeId={placeId || ''} />
          </>
        )}
      </div>
    </main>
  );
}

import React from 'react';
