import * as logger from 'firebase-functions/logger';
import { onRequest } from 'firebase-functions/v2/https';

import { MCP_SHARED_KEY } from '../../secrets.constants';
import { isAuthorizedKey } from '../mcp-auth.helper';
import { parseSearchLibraryRequest } from '../mcp-request.helper';
import { mcpAuth, mcpErrors } from '../mcp.constants';
import { LibrarySearchService } from '../services/library-search.service';

export const searchLibrary = onRequest({ secrets: [MCP_SHARED_KEY], timeoutSeconds: 30 }, async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).json({ error: mcpErrors.METHOD_NOT_ALLOWED });

    return;
  }

  if (!isAuthorizedKey(request.header(mcpAuth.KEY_HEADER), MCP_SHARED_KEY.value())) {
    logger.warn('searchLibrary rejected a request with a missing or wrong key');
    response.status(401).json({ error: mcpErrors.UNAUTHORIZED });

    return;
  }

  const parsed = parseSearchLibraryRequest(request.body);

  if (parsed.error !== undefined) {
    response.status(400).json({ error: parsed.error });

    return;
  }

  try {
    const items = await new LibrarySearchService().search(parsed.value);
    const body: Afterword.Types.ISearchLibraryResponse = { items };
    response.status(200).json(body);
  } catch (error) {
    logger.error('searchLibrary failed', { error: error instanceof Error ? error.message : String(error) });
    response.status(500).json({ error: mcpErrors.LIBRARY_SEARCH_FAILED });
  }
});
