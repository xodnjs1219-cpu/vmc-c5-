import axios, { type AxiosInstance } from 'axios';

/**
 * Naver Search API 응답 좌표를 WGS84로 변환
 * Naver Local Search API는 경위도 * 10,000,000 형태로 반환
 */
function convertNaverCoords(mapx: number, mapy: number): { latitude: number; longitude: number } {
  // mapx는 경도(longitude), mapy는 위도(latitude)
  // 10,000,000으로 나누어 실제 좌표로 변환
  return {
    latitude: mapy / 10000000,
    longitude: mapx / 10000000,
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
        const { latitude, longitude } = convertNaverCoords(item.mapx, item.mapy);
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
        // 상세한 에러 로깅
        console.error('Naver Search API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          code: error.code,
        });

        if (error.code === 'ECONNABORTED') {
          throw new Error('SEARCH_TIMEOUT_ERROR');
        }
        if (error.response?.status === 400) {
          throw new Error('SEARCH_QUERY_INVALID');
        }
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error('SEARCH_AUTH_ERROR');
        }
        throw new Error('SEARCH_API_ERROR');
      }
      console.error('Unknown search error:', error);
      throw new Error('SEARCH_API_ERROR');
    }
  }
}

export const createNaverSearchClient = (clientId: string, clientSecret: string) => {
  return new NaverSearchClient(clientId, clientSecret);
};
