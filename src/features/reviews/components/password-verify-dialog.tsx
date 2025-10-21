'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useVerifyPassword } from '../hooks/useVerifyPassword';

interface PasswordVerifyDialogProps {
  reviewId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  actionType?: 'edit' | 'delete';
}

export function PasswordVerifyDialog({
  reviewId,
  isOpen,
  onOpenChange,
  onSuccess,
  actionType = 'edit',
}: PasswordVerifyDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { mutate: verifyPassword, isPending } = useVerifyPassword(reviewId, {
    onSuccess: () => {
      setPassword('');
      setError('');
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message || '비밀번호가 일치하지 않습니다';
      setError(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError('비밀번호를 입력하세요');
      return;
    }

    verifyPassword(password);
  };

  const actionText = actionType === 'delete' ? '삭제' : '수정';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>비밀번호 확인</CardTitle>
          <CardDescription>
            리뷰를 {actionText}하기 위해 비밀번호를 입력해주세요.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '확인 중...' : '확인'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
