'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import type { PlaceDetailResponse } from '../lib/dto';

interface PlaceHeaderProps {
  place: PlaceDetailResponse['place'];
}

export function PlaceHeader({ place }: PlaceHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl">{place.name}</CardTitle>
            <CardDescription className="mt-2">{place.address}</CardDescription>
          </div>
          <Badge variant="outline">{place.category}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(place.averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="font-semibold">{place.averageRating.toFixed(1)}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            리뷰 {place.reviewCount}개
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
