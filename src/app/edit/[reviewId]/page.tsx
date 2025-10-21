'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReviewForm } from '@/features/reviews/components/review-form';
import { useReviewQuery } from '@/features/reviews/hooks/useReviewQuery';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface EditPageProps {
  params: Promise<{
    reviewId: string;
  }>;
}

export default function EditPage({ params }: EditPageProps) {
  const router = useRouter();
  const [reviewId, setReviewId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setReviewId(p.reviewId));
  }, [params]);

  const { data: review, isLoading, error } = useReviewQuery(reviewId);

  if (!reviewId) {
    return (
      <div className="container max-w-2xl py-6">
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive text-center">
          잘못된 접근입니다.
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
            리뷰를 불러올 수 없습니다
          </div>
        )}

        {/* 리뷰 수정 폼 */}
        {review && (
          <Card>
            <CardHeader>
              <CardTitle>리뷰 수정</CardTitle>
              <CardDescription>
                리뷰 내용을 수정하고 저장할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewEditForm review={review} reviewId={reviewId} />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

// 리뷰 수정 폼 컴포넌트
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RatingInput } from '@/features/reviews/components/rating-input';
import { useUpdateReview } from '@/features/reviews/hooks/useUpdateReview';
import { CreateReviewRequestSchema } from '@/features/reviews/backend/schema';

interface ReviewEditFormProps {
  review: any;
  reviewId: string;
}

function ReviewEditForm({ review, reviewId }: ReviewEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { mutate: updateReview, isPending } = useUpdateReview(reviewId, {
    onSuccess: (data) => {
      toast({
        title: '성공',
        description: '리뷰가 수정되었습니다.',
      });
      router.push(`/place/${data.placeId}`);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message || '리뷰 수정에 실패했습니다.';
      toast({
        title: '오류',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(CreateReviewRequestSchema),
    defaultValues: {
      authorName: review.authorName,
      rating: review.rating,
      content: review.content,
      password: '',
    },
  });

  const rating = watch('rating');

  const onSubmit = (data: any) => {
    updateReview(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 작성자명 */}
      <div className="space-y-2">
        <Label htmlFor="authorName">작성자명</Label>
        <Input
          id="authorName"
          placeholder="이름을 입력하세요"
          {...register('authorName')}
          aria-invalid={!!errors.authorName}
        />
        {errors.authorName && (
          <p className="text-sm text-red-500">{errors.authorName.message}</p>
        )}
      </div>

      {/* 평점 */}
      <div className="space-y-2">
        <Label>평점</Label>
        <RatingInput value={rating} onChange={(r) => setValue('rating', r)} />
        {errors.rating && (
          <p className="text-sm text-red-500">{errors.rating.message}</p>
        )}
      </div>

      {/* 리뷰 내용 */}
      <div className="space-y-2">
        <Label htmlFor="content">리뷰 내용</Label>
        <Textarea
          id="content"
          placeholder="리뷰를 작성해주세요"
          rows={5}
          {...register('content')}
          aria-invalid={!!errors.content}
        />
        {errors.content && (
          <p className="text-sm text-red-500">{errors.content.message}</p>
        )}
      </div>

      {/* 비밀번호 */}
      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          placeholder="기존 비밀번호를 다시 입력하세요"
          {...register('password')}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* 제출 버튼 */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            수정 중...
          </>
        ) : (
          '수정 완료'
        )}
      </Button>
    </form>
  );
}
