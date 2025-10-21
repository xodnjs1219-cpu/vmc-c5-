'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ReviewCard } from '@/features/reviews/components/review-card';
import type { PlaceDetailResponse } from '../lib/dto';

interface ReviewListProps {
  reviews: PlaceDetailResponse['reviews'];
  placeId: string;
  onReviewDeleted?: () => void;
}

export function ReviewList({ reviews, placeId, onReviewDeleted }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            아직 작성된 리뷰가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          placeId={placeId}
          onReviewDeleted={onReviewDeleted}
        />
      ))}
    </div>
  );
}
