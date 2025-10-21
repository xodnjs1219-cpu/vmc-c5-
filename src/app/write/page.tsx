'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReviewForm } from '@/features/reviews/components/review-form';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function WritePage() {
  const searchParams = useSearchParams();
  const placeId = searchParams.get('placeId');
  const placeName = searchParams.get('placeName');
  const placeInfoParam = searchParams.get('placeInfo');

  let placeInfo;
  if (placeInfoParam) {
    try {
      placeInfo = JSON.parse(decodeURIComponent(placeInfoParam));
    } catch {
      placeInfo = undefined;
    }
  }

  if (!placeId) {
    return (
      <div className="container max-w-2xl py-6">
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive text-center">
          잘못된 접근입니다. 검색 결과에서 리뷰 작성을 시도해주세요.
        </div>
      </div>
    );
  }

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

        {/* 장소 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>리뷰 작성</CardTitle>
            {placeName && (
              <CardDescription className="text-base font-semibold text-foreground">
                {decodeURIComponent(placeName)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <ReviewForm placeId={placeId} placeInfo={placeInfo} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
