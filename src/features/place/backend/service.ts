import { SupabaseClient } from '@supabase/supabase-js';
import { PlaceDetailResponseSchema } from './schema';
import { PLACE_ERRORS } from './error';

export async function getPlaceDetail(client: SupabaseClient, placeId: string) {
  try {
    // 1. 장소 정보 조회
    const { data: place, error: placeError } = await client
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (placeError || !place) {
      return {
        success: false,
        error: PLACE_ERRORS.PLACE_NOT_FOUND,
        data: null,
      };
    }

    // 2. 리뷰 목록 조회 (최신순)
    const { data: reviews, error: reviewsError } = await client
      .from('reviews')
      .select('*')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      return {
        success: false,
        error: PLACE_ERRORS.REVIEWS_FETCH_ERROR,
        data: null,
      };
    }

    const response = {
      place: {
        id: place.id,
        name: place.name,
        address: place.address,
        category: place.category,
        averageRating: place.average_rating,
        reviewCount: place.review_count,
      },
      reviews: (reviews || []).map((review) => ({
        id: review.id,
        authorName: review.author_name,
        rating: review.rating,
        content: review.content,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
      })),
    };

    const validation = PlaceDetailResponseSchema.safeParse(response);
    if (!validation.success) {
      return {
        success: false,
        error: PLACE_ERRORS.PLACE_FETCH_ERROR,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: validation.data,
    };
  } catch (error) {
    return {
      success: false,
      error: PLACE_ERRORS.PLACE_FETCH_ERROR,
      data: null,
    };
  }
}
