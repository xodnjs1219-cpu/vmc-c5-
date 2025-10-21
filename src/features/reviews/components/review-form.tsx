'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RatingInput } from './rating-input';
import { useCreateReview } from '../hooks/useCreateReview';
import { CreateReviewRequestSchema } from '../backend/schema';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  placeId: string;
  placeInfo?: {
    name: string;
    address: string;
    category: string;
    latitude: number;
    longitude: number;
  };
}

export function ReviewForm({ placeId, placeInfo }: ReviewFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { mutate: createReview, isPending } = useCreateReview({
    onSuccess: (data) => {
      toast({
        title: '성공',
        description: '리뷰가 저장되었습니다.',
      });
      router.push(`/place/${data.placeId}`);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message || '리뷰 저장에 실패했습니다.';
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
      authorName: '',
      rating: 0,
      content: '',
      password: '',
    },
  });

  const rating = watch('rating');

  const onSubmit = (data: any) => {
    createReview({
      placeId,
      placeInfo,
      ...data,
    });
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
          placeholder="리뷰 수정/삭제 시 필요한 비밀번호를 입력하세요"
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
            저장 중...
          </>
        ) : (
          '저장'
        )}
      </Button>
    </form>
  );
}
