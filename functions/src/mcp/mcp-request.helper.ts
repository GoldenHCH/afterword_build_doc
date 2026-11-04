import { isDocumentId } from '../library/library.helper';
import { mcpErrors, mcpLimits } from './mcp.constants';
import { IParsedSearchLibrary, IParsedSearchPapers } from './mcp.interfaces';
import { RequestValidation } from './mcp.types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isWholeNumberBetween(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= minimum && value <= maximum;
}

export function parseSearchPapersRequest(body: unknown): RequestValidation<IParsedSearchPapers> {
  if (!isPlainObject(body)) {
    return { error: mcpErrors.BODY_REQUIRED };
  }

  const angle = typeof body['angle'] === 'string' ? body['angle'].trim() : '';

  if (angle.length < mcpLimits.ANGLE_MIN_LENGTH || angle.length > mcpLimits.ANGLE_MAX_LENGTH) {
    return { error: mcpErrors.ANGLE_REQUIRED };
  }

  const rawKeywords = body['keywords'] ?? [];

  if (
    !Array.isArray(rawKeywords) ||
    rawKeywords.length > mcpLimits.KEYWORDS_MAX_COUNT ||
    rawKeywords.some((keyword) => typeof keyword !== 'string' || keyword.length > mcpLimits.KEYWORD_MAX_LENGTH)
  ) {
    return { error: mcpErrors.KEYWORDS_INVALID };
  }

  const keywords = (rawKeywords as string[]).map((keyword) => keyword.trim()).filter((keyword) => keyword.length > 0);
  const limit = body['limit'] ?? mcpLimits.PAPERS_DEFAULT_LIMIT;

  if (!isWholeNumberBetween(limit, 1, mcpLimits.PAPERS_MAX_LIMIT)) {
    return { error: mcpErrors.PAPERS_LIMIT_INVALID };
  }

  return { value: { angle, keywords, limit } };
}

export function parseSearchLibraryRequest(body: unknown): RequestValidation<IParsedSearchLibrary> {
  if (!isPlainObject(body)) {
    return { error: mcpErrors.BODY_REQUIRED };
  }

  const userId = body['userId'];

  if (!isDocumentId(userId)) {
    return { error: mcpErrors.USER_ID_REQUIRED };
  }

  const noteId = body['noteId'];

  if (noteId !== undefined && !isDocumentId(noteId)) {
    return { error: mcpErrors.NOTE_ID_INVALID };
  }

  const rawQuery = body['query'] ?? '';

  if (typeof rawQuery !== 'string' || rawQuery.trim().length > mcpLimits.QUERY_MAX_LENGTH) {
    return { error: mcpErrors.QUERY_INVALID };
  }

  const limit = body['limit'] ?? mcpLimits.LIBRARY_DEFAULT_LIMIT;

  if (!isWholeNumberBetween(limit, 1, mcpLimits.LIBRARY_MAX_LIMIT)) {
    return { error: mcpErrors.LIBRARY_LIMIT_INVALID };
  }

  const parsed: IParsedSearchLibrary = { userId, query: rawQuery.trim(), limit };

  if (noteId !== undefined) {
    parsed.noteId = noteId;
  }

  return { value: parsed };
}
