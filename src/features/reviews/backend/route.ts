import { Hono } from 'hono';
import {
  createReview,
  verifyReviewPassword,
  getReviewById,
  updateReview,
  deleteReview,
} from './service';
import { REVIEW_ERRORS } from './error';
import { respond, success, failure } from '@/backend/http/response';
import { getSupabase, getLogger, type AppEnv } from '@/backend/hono/context';

export function registerReviewRoutes(app: Hono<AppEnv>) {
  // 리뷰 생성
  app.post('/api/reviews', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const body = await c.req.json();
      const { placeId, placeInfo, ...reviewData } = body;

      if (!placeId) {
        const result = failure(400, 'PLACE_ID_REQUIRED', '장소 ID가 필요합니다');
        return respond(c, result);
      }

      const createResult = await createReview(supabase, placeId, placeInfo, reviewData);

      if (!createResult.success) {
        const error = createResult.error!;
        const result = failure(error.statusCode as any, error.code, error.message);
        return respond(c, result);
      }

      const result = success(createResult.data, 201);
      return respond(c, result);
    } catch (error) {
      logger.error('Create review error:', error);
      const result = failure(
        500,
        REVIEW_ERRORS.REVIEW_CREATE_ERROR.code,
        REVIEW_ERRORS.REVIEW_CREATE_ERROR.message
      );
      return respond(c, result);
    }
  });

  // 비밀번호 인증
  app.post('/api/reviews/:reviewId/verify', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const reviewId = c.req.param('reviewId');
      const body = await c.req.json();
      const { password } = body;

      if (!password) {
        const result = failure(400, 'PASSWORD_REQUIRED', '비밀번호가 필요합니다');
        return respond(c, result);
      }

      const verifyResult = await verifyReviewPassword(supabase, reviewId, password);

      if (!verifyResult.success) {
        const error = verifyResult.error!;
        const result = failure(error.statusCode as any, error.code, error.message);
        return respond(c, result);
      }

      const result = success({ verified: true }, 200);
      return respond(c, result);
    } catch (error) {
      logger.error('Verify password error:', error);
      const result = failure(
        500,
        REVIEW_ERRORS.REVIEW_CREATE_ERROR.code,
        '비밀번호 확인 중 오류가 발생했습니다'
      );
      return respond(c, result);
    }
  });

  // 리뷰 조회
  app.get('/api/reviews/:reviewId', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const reviewId = c.req.param('reviewId');

      const getResult = await getReviewById(supabase, reviewId);

      if (!getResult.success) {
        const error = getResult.error!;
        const result = failure(error.statusCode as any, error.code, error.message);
        return respond(c, result);
      }

      const result = success(getResult.data, 200);
      return respond(c, result);
    } catch (error) {
      logger.error('Get review error:', error);
      const result = failure(
        500,
        REVIEW_ERRORS.REVIEW_CREATE_ERROR.code,
        '리뷰 조회 중 오류가 발생했습니다'
      );
      return respond(c, result);
    }
  });

  // 리뷰 수정
  app.patch('/api/reviews/:reviewId', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const reviewId = c.req.param('reviewId');
      const body = await c.req.json();

      const updateResult = await updateReview(supabase, reviewId, body);

      if (!updateResult.success) {
        const error = updateResult.error!;
        const result = failure(error.statusCode as any, error.code, error.message);
        return respond(c, result);
      }

      const result = success(updateResult.data, 200);
      return respond(c, result);
    } catch (error) {
      logger.error('Update review error:', error);
      const result = failure(
        500,
        REVIEW_ERRORS.REVIEW_CREATE_ERROR.code,
        '리뷰 수정 중 오류가 발생했습니다'
      );
      return respond(c, result);
    }
  });

  // 리뷰 삭제
  app.delete('/api/reviews/:reviewId', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const reviewId = c.req.param('reviewId');

      const deleteResult = await deleteReview(supabase, reviewId);

      if (!deleteResult.success) {
        const error = deleteResult.error!;
        const result = failure(error.statusCode as any, error.code, error.message);
        return respond(c, result);
      }

      const result = success(deleteResult.data, 200);
      return respond(c, result);
    } catch (error) {
      logger.error('Delete review error:', error);
      const result = failure(
        500,
        REVIEW_ERRORS.REVIEW_CREATE_ERROR.code,
        '리뷰 삭제 중 오류가 발생했습니다'
      );
      return respond(c, result);
    }
  });
}
