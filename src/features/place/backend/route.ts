import { Hono } from 'hono';
import { getPlaceDetail } from './service';
import { PlaceParamsSchema } from './schema';
import { PLACE_ERRORS } from './error';
import { respond, success, failure } from '@/backend/http/response';
import { getSupabase, getLogger, type AppEnv } from '@/backend/hono/context';

export function registerPlaceRoutes(app: Hono<AppEnv>) {
  // 리뷰가 있는 모든 장소 조회
  app.get('/api/places', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const { data: places, error } = await supabase
        .from('places')
        .select('id, name, latitude, longitude, average_rating, review_count')
        .gt('review_count', 0)
        .order('review_count', { ascending: false });

      if (error) {
        const result = failure(
          500,
          PLACE_ERRORS.PLACE_FETCH_ERROR.code,
          PLACE_ERRORS.PLACE_FETCH_ERROR.message
        );
        return respond(c, result);
      }

      const result = success({ data: places || [] }, 200);
      return respond(c, result);
    } catch (error) {
      logger.error('Get places error:', error);
      const result = failure(
        500,
        PLACE_ERRORS.PLACE_FETCH_ERROR.code,
        PLACE_ERRORS.PLACE_FETCH_ERROR.message
      );
      return respond(c, result);
    }
  });

  // 특정 장소 상세 조회
  app.get('/api/places/:placeId', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const placeId = c.req.param('placeId');

      // 파라미터 검증
      const paramValidation = PlaceParamsSchema.safeParse({ placeId });
      if (!paramValidation.success) {
        const result = failure(
          400,
          PLACE_ERRORS.PLACE_ID_INVALID.code,
          PLACE_ERRORS.PLACE_ID_INVALID.message
        );
        return respond(c, result);
      }

      const placeResult = await getPlaceDetail(supabase, placeId);

      if (!placeResult.success) {
        const error = placeResult.error!;
        const result = failure(error.statusCode as any, error.code, error.message);
        return respond(c, result);
      }

      const result = success(placeResult.data, 200);
      return respond(c, result);
    } catch (error) {
      logger.error('Get place detail error:', error);
      const result = failure(
        500,
        PLACE_ERRORS.PLACE_FETCH_ERROR.code,
        PLACE_ERRORS.PLACE_FETCH_ERROR.message
      );
      return respond(c, result);
    }
  });
}
