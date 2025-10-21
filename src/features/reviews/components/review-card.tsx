'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Edit2, Trash2 } from 'lucide-react';
import { PasswordVerifyDialog } from './password-verify-dialog';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useDeleteReview } from '../hooks/useDeleteReview';
import type { PlaceDetailResponse } from '@/features/place/lib/dto';

interface ReviewCardProps {
  review: PlaceDetailResponse['reviews'][0];
  placeId: string;
  onReviewDeleted?: () => void;
}

export function ReviewCard({
  review,
  placeId,
  onReviewDeleted,
}: ReviewCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordDialogAction, setPasswordDialogAction] = useState<'edit' | 'delete'>('edit');

  const { mutate: deleteReview } = useDeleteReview(review.id, {
    onSuccess: () => {
      toast({
        title: '성공',
        description: '리뷰가 삭제되었습니다',
      });
      onReviewDeleted?.();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || '삭제에 실패했습니다';
      toast({
        title: '오류',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const handleEditClick = () => {
    setPasswordDialogAction('edit');
    setPasswordDialogOpen(true);
  };

  const handleDeleteClick = () => {
    setPasswordDialogAction('delete');
    setPasswordDialogOpen(true);
  };

  const handlePasswordVerified = () => {
    if (passwordDialogAction === 'edit') {
      router.push(`/edit/${review.id}`);
    } else {
      deleteReview();
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <CardTitle className="text-base">{review.authorName}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {new Date(review.createdAt).toLocaleDateString('ko-KR')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleEditClick}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{review.content}</p>
        </CardContent>
      </Card>

      <PasswordVerifyDialog
        reviewId={review.id}
        isOpen={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onSuccess={handlePasswordVerified}
        actionType={passwordDialogAction}
      />
    </>
  );
}
