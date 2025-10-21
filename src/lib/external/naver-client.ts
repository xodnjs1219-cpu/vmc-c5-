import axios, { type AxiosInstance } from 'axios';

/**
 * Naver Search API 응답 좌표계 (KATECH/GRS80)를 WGS84로 변환
 * KATECH는 한국 표준 좌표계이며, WGS84(GPS)로 변환 필요
 */
function katech2wgs84(x: number, y: number): { latitude: number; longitude: number } {
  // 간단한 근사값 변환 (정확한 변환은 더 복잡함)
  // Naver의 좌표계는 실제로 EPSG:5179 (GRS80)
  // 여기서는 대략적인 오프셋만 적용 (실제는 공식 라이브러리 사용 권장)
  const lon = x / 10000000 + 0.0;
  const lat = y / 10000000 + 0.0;

  return {
    latitude: lat,
    longitude: lon,
  };
}

export interface NaverSearchResult {
  title: string;
  address: string;
  category: string;
  mapx: number; // KATECH X좌표
  mapy: number; // KATECH Y좌표
  link: string;
}

export interface SearchResult {
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  link: string;
}

export interface NaverSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverSearchResult[];
}

export class NaverSearchClient {
  private axiosInstance: AxiosInstance;
  private clientId: string;
  private clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.axiosInstance = axios.create({
      baseURL: 'https://openapi.naver.com',
      timeout: 10000,
    });
  }

  /**
   * HTML 태그 제거 함수
   */
  private stripHtmlTags(text: string): string {
    return text.replace(/<[^>]*>/g, '');
  }

  /**
   * Naver Search API에서 장소 검색
   */
  async search(query: string, display: number = 5): Promise<SearchResult[]> {
    try {
      const response = await this.axiosInstance.get<NaverSearchResponse>(
        '/v1/search/local.json',
        {
          params: {
            query,
            display,
            sort: 'sim', // 관련도순
          },
          headers: {
            'X-Naver-Client-Id': this.clientId,
            'X-Naver-Client-Secret': this.clientSecret,
          },
        }
      );

      if (!response.data.items || response.data.items.length === 0) {
        return [];
      }

      return response.data.items.map((item) => {
        const { latitude, longitude } = katech2wgs84(item.mapx, item.mapy);
        return {
          name: this.stripHtmlTags(item.title),
          address: this.stripHtmlTags(item.address),
          category: this.stripHtmlTags(item.category),
          latitude,
          longitude,
          link: item.link,
        };
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('SEARCH_TIMEOUT_ERROR');
        }
        if (error.response?.status === 400) {
          throw new Error('SEARCH_QUERY_INVALID');
        }
        throw new Error('SEARCH_API_ERROR');
      }
      throw new Error('SEARCH_API_ERROR');
    }
  }
}

export const createNaverSearchClient = (clientId: string, clientSecret: string) => {
  return new NaverSearchClient(clientId, clientSecret);
};
