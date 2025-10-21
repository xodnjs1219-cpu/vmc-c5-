'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const [isMounted, setIsMounted] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // 네이버 지도 스크립트 로드 확인
    const checkNaverMaps = () => {
      if (typeof window !== 'undefined' && window.naver && window.naver.maps) {
        setIsMapLoaded(true);
      } else {
        setTimeout(checkNaverMaps, 100);
      }
    };
    
    checkNaverMaps();
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
    enabled: isMounted && isMapLoaded,
  });

  if (!isMounted || !isMapLoaded) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-muted rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <NaverMapContent places={places} isLoading={isLoading} router={router} />;
}

function NaverMapContent({ 
  places, 
  isLoading, 
  router 
}: { 
  places: Place[]; 
  isLoading: boolean; 
  router: ReturnType<typeof useRouter>;
}) {
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const [markers, setMarkers] = useState<naver.maps.Marker[]>([]);

  useEffect(() => {
    if (!window.naver || !window.naver.maps) return;

    const mapDiv = document.getElementById('naverMap');
    if (!mapDiv) return;

    // 지도 생성
    const defaultCenter = new window.naver.maps.LatLng(37.5665, 126.978);
    const newMap = new window.naver.maps.Map(mapDiv, {
      center: defaultCenter,
      zoom: 11,
    });

    setMap(newMap);

    return () => {
      // 클린업
      markers.forEach(marker => marker.setMap(null));
      setMarkers([]);
    };
  }, []);

  useEffect(() => {
    if (!map || !window.naver || !window.naver.maps) return;

    // 기존 마커 제거
    markers.forEach(marker => marker.setMap(null));

    // 새 마커 생성
    const newMarkers = places.map((place) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(place.latitude, place.longitude),
        map: map,
        title: place.name,
      });

      // 마커 클릭 이벤트
      window.naver.maps.Event.addListener(marker, 'click', () => {
        router.push(`/place/${place.id}`);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [map, places, router]);

  return (
    <div className="w-full space-y-4">
      <div id="naverMap" style={{ width: '100%', height: '400px' }} className="rounded-lg overflow-hidden" />

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
