import { Hono } from 'hono';
import { searchPlaces } from './service';
import { SEARCH_ERRORS } from './error';
import { respond, success, failure } from '@/backend/http/response';
import { getConfig, getLogger, type AppEnv } from '@/backend/hono/context';

export function registerSearchRoutes(app: Hono<AppEnv>) {
  app.get('/api/search', async (c) => {
    const logger = getLogger(c);
    const config = getConfig(c);

    try {
      const query = c.req.query('query');

      if (!query || !query.trim()) {
        const result = failure(
          400,
          SEARCH_ERRORS.SEARCH_QUERY_REQUIRED.code,
          SEARCH_ERRORS.SEARCH_QUERY_REQUIRED.message
        );
        return respond(c, result);
      }

      const searchResult = await searchPlaces(query.trim(), config.naver);

      if (!searchResult.success) {
        const error = searchResult.error!;
        const result = failure(
          error.statusCode as any,
          error.code,
          error.message
        );
        return respond(c, result);
      }

      const result = success(searchResult.data, 200);
      return respond(c, result);
    } catch (error) {
      logger.error('Search error:', error);
      const result = failure(
        500,
        SEARCH_ERRORS.SEARCH_API_ERROR.code,
        SEARCH_ERRORS.SEARCH_API_ERROR.message
      );
      return respond(c, result);
    }
  });
}
