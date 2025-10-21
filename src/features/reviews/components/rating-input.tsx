'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingInputProps {
  value?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
}

export function RatingInput({
  value = 0,
  onChange,
  readOnly = false,
}: RatingInputProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => !readOnly && onChange?.(rating)}
          disabled={readOnly}
          className={cn(
            'transition-colors',
            readOnly && 'cursor-default',
            !readOnly && 'cursor-pointer hover:opacity-80'
          )}
        >
          <Star
            className={cn(
              'h-6 w-6',
              rating <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}
