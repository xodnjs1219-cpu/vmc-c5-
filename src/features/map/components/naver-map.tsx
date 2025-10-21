'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Container as MapDiv, NaverMap, Marker, useNavermaps } from 'react-naver-maps';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/remote/api-client';

interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  average_rating: number;
  review_count: number;
}

export function NaverMapComponent() {
  const router = useRouter();
  const navermaps = useNavermaps();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 리뷰가 있는 모든 장소 조회
  const { data: places = [], isLoading } = useQuery({
    queryKey: ['places-with-reviews'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/places');
        return response.data.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5분 캐시
    enabled: isMounted,
  });

  if (!isMounted || !navermaps) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-muted rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 기본 센터 (서울)
  const defaultCenter = new navermaps.LatLng(37.5665, 126.978);

  return (
    <div className="w-full space-y-4">
      <MapDiv style={{ width: '100%', height: '400px' }} className="rounded-lg overflow-hidden">
        <NaverMap defaultCenter={defaultCenter} defaultZoom={11}>
          {places.map((place) => (
            <Marker
              key={place.id}
              position={new navermaps.LatLng(place.latitude, place.longitude)}
              title={place.name}
              onClick={() => {
                router.push(`/place/${place.id}`);
              }}
            />
          ))}
        </NaverMap>
      </MapDiv>

      {/* 장소 목록 (선택사항) */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : places.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {places.slice(0, 6).map((place) => (
            <button
              key={place.id}
              onClick={() => router.push(`/place/${place.id}`)}
              className="text-left p-3 border rounded-lg hover:bg-muted transition-colors"
            >
              <div className="font-semibold text-foreground">{place.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                ⭐ {place.average_rating.toFixed(1)} ({place.review_count}개 리뷰)
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground py-8">
          아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!
        </div>
      )}
    </div>
  );
}
