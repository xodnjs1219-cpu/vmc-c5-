import { SupabaseClient } from '@supabase/supabase-js';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import {
  CreateReviewRequestSchema,
  ReviewTableRowSchema,
  PlaceTableRowSchema,
  PlaceInfoSchema,
} from './schema';
import { REVIEW_ERRORS } from './error';

export async function createReview(
  client: SupabaseClient,
  placeId: string,
  placeInfo: unknown,
  data: unknown
) {
  // 요청 데이터 검증
  const validation = CreateReviewRequestSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: REVIEW_ERRORS.INVALID_REVIEW_DATA,
      data: null,
    };
  }

  const validatedData = validation.data;

  try {
    // 1. 장소 확인 또는 생성
    let place;
    const { data: existingPlace, error: placeError } = await client
      .from('places')
      .select('id, review_count, average_rating')
      .eq('id', placeId)
      .single();

    if (placeError) {
      // 장소가 없으면 생성
      if (placeInfo) {
        const placeValidation = PlaceInfoSchema.safeParse(placeInfo);
        if (!placeValidation.success) {
          console.error('Place info validation failed:', {
            errors: placeValidation.error.errors,
            placeInfo,
          });
          return {
            success: false,
            error: REVIEW_ERRORS.PLACE_NOT_FOUND,
            data: null,
          };
        }

        const placeData = placeValidation.data;
        const { data: newPlace, error: createError } = await client
          .from('places')
          .insert({
            id: placeId,
            name: placeData.name,
            address: placeData.address,
            category: placeData.category,
            latitude: placeData.latitude,
            longitude: placeData.longitude,
            average_rating: 0,
            review_count: 0,
          })
          .select()
          .single();

        if (createError || !newPlace) {
          console.error('Place creation failed:', {
            error: createError,
            placeId,
            placeData,
          });
          return {
            success: false,
            error: REVIEW_ERRORS.PLACE_NOT_FOUND,
            data: null,
          };
        }
        place = newPlace;
      } else {
        console.error('Place not found and no placeInfo provided:', { placeId });
        return {
          success: false,
          error: REVIEW_ERRORS.PLACE_NOT_FOUND,
          data: null,
        };
      }
    } else {
      place = existingPlace;
    }

    // 2. 비밀번호 해싱
    let passwordHash: string;
    try {
      passwordHash = await hashPassword(validatedData.password);
    } catch {
      return {
        success: false,
        error: REVIEW_ERRORS.PASSWORD_HASH_ERROR,
        data: null,
      };
    }

    // 3. 리뷰 생성
    const { data: newReview, error: reviewError } = await client
      .from('reviews')
      .insert({
        place_id: placeId,
        author_name: validatedData.authorName,
        rating: validatedData.rating,
        content: validatedData.content,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (reviewError || !newReview) {
      return {
        success: false,
        error: REVIEW_ERRORS.REVIEW_CREATE_ERROR,
        data: null,
      };
    }

    // 4. 장소 통계 갱신
    const { data: allReviews, error: reviewsError } = await client
      .from('reviews')
      .select('rating')
      .eq('place_id', placeId);

    if (reviewsError) {
      return {
        success: false,
        error: REVIEW_ERRORS.PLACE_UPDATE_ERROR,
        data: null,
      };
    }

    const newReviewCount = allReviews?.length || 1;
    const averageRating =
      allReviews && allReviews.length > 0
        ? Math.round(
            (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10
          ) / 10
        : validatedData.rating;

    const { error: updateError } = await client
      .from('places')
      .update({
        review_count: newReviewCount,
        average_rating: averageRating,
      })
      .eq('id', placeId);

    if (updateError) {
      return {
        success: false,
        error: REVIEW_ERRORS.PLACE_UPDATE_ERROR,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: {
        id: newReview.id,
        placeId: newReview.place_id,
        authorName: newReview.author_name,
        rating: newReview.rating,
        content: newReview.content,
        createdAt: newReview.created_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: REVIEW_ERRORS.REVIEW_CREATE_ERROR,
      data: null,
    };
  }
}

// 비밀번호 인증 함수
export async function verifyReviewPassword(
  client: SupabaseClient,
  reviewId: string,
  password: string
) {
  try {
    const { data: review, error } = await client
      .from('reviews')
      .select('password_hash')
      .eq('id', reviewId)
      .single();

    if (error || !review) {
      return {
        success: false,
        error: REVIEW_ERRORS.REVIEW_NOT_FOUND,
      };
    }

    const isValid = await verifyPassword(password, review.password_hash);
    if (!isValid) {
      return {
        success: false,
        error: REVIEW_ERRORS.INVALID_PASSWORD,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: REVIEW_ERRORS.REVIEW_NOT_FOUND,
    };
  }
}

// 리뷰 조회 함수
export async function getReviewById(client: SupabaseClient, reviewId: string) {
  try {
    const { data: review, error } = await client
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (error || !review) {
      return {
        success: false,
        error: REVIEW_ERRORS.REVIEW_NOT_FOUND,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: {
        id: review.id,
        authorName: review.author_name,
        rating: review.rating,
        content: review.content,
        placeId: review.place_id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: REVIEW_ERRORS.REVIEW_NOT_FOUND,
      data: null,
    };
  }
}

// 리뷰 수정 함수
export async function updateReview(
  client: SupabaseClient,
  reviewId: string,
  data: unknown
) {
  const validation = CreateReviewRequestSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: REVIEW_ERRORS.INVALID_REVIEW_DATA,
      data: null,
    };
  }

  const validatedData = validation.data;

  try {
    // 1. 기존 리뷰 조회
    const { data: review, error: reviewError } = await client
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return {
        success: false,
        error: REVIEW_ERRORS.REVIEW_NOT_FOUND,
        data: null,
      };
    }

    // 2. 리뷰 수정
    const { error: updateError } = await client
      .from('reviews')
      .update({
        author_name: validatedData.authorName,
        rating: validatedData.rating,
        content: validatedData.content,
      })
      .eq('id', reviewId);

    if (updateError) {
      return {
        success: false,
        error: REVIEW_ERRORS.REVIEW_CREATE_ERROR,
        data: null,
      };
    }

    // 3. 장소 평균 평점 재계산
    const { data: allReviews, error: reviewsError } = await client
      .from('reviews')
      .select('rating')
      .eq('place_id', review.place_id);

    if (reviewsError) {
      return {
        success: false,
        error: REVIEW_ERRORS.PLACE_UPDATE_ERROR,
        data: null,
      };
    }

    const averageRating =
      allReviews && allReviews.length > 0
        ? Math.round(
            (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10
          ) / 10
        : 0;

    const { error: placeUpdateError } = await client
      .from('places')
      .update({
        average_rating: averageRating,
      })
      .eq('id', review.place_id);

    if (placeUpdateError) {
      return {
        success: false,
        error: REVIEW_ERRORS.PLACE_UPDATE_ERROR,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: {
        id: reviewId,
        placeId: review.place_id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: REVIEW_ERRORS.REVIEW_CREATE_ERROR,
      data: null,
    };
  }
}

// 리뷰 삭제 함수
export async function deleteReview(
  client: SupabaseClient,
  reviewId: string
) {
  try {
    // 1. 기존 리뷰 조회
    const { data: review, error: reviewError } = await client
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return {
        success: false,
        error: REVIEW_ERRORS.REVIEW_NOT_FOUND,
        data: null,
      };
    }

    const placeId = review.place_id;

    // 2. 리뷰 삭제
    const { error: deleteError } = await client
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) {
      return {
        success: false,
        error: REVIEW_ERRORS.REVIEW_CREATE_ERROR,
        data: null,
      };
    }

    // 3. 장소 통계 갱신
    const { data: remainingReviews, error: reviewsError } = await client
      .from('reviews')
      .select('rating')
      .eq('place_id', placeId);

    if (reviewsError) {
      return {
        success: false,
        error: REVIEW_ERRORS.PLACE_UPDATE_ERROR,
        data: null,
      };
    }

    const newReviewCount = remainingReviews?.length || 0;
    const averageRating =
      remainingReviews && remainingReviews.length > 0
        ? Math.round(
            (remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length) * 10
          ) / 10
        : 0;

    const { error: placeUpdateError } = await client
      .from('places')
      .update({
        review_count: newReviewCount,
        average_rating: averageRating,
      })
      .eq('id', placeId);

    if (placeUpdateError) {
      return {
        success: false,
        error: REVIEW_ERRORS.PLACE_UPDATE_ERROR,
        data: null,
      };
    }

    return {
      success: true,
      error: null,
      data: {
        reviewId,
        placeId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: REVIEW_ERRORS.REVIEW_CREATE_ERROR,
      data: null,
    };
  }
}
