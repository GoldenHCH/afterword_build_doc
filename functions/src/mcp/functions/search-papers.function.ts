import * as logger from 'firebase-functions/logger';
import { onRequest } from 'firebase-functions/v2/https';

import { findLimits } from '../../find/find.constants';
import { createPaperSource } from '../../find/services/paper-source.factory';
import { MCP_SHARED_KEY, OPENALEX_API_KEY, optionalSourceSecrets } from '../../secrets.constants';
import { itemKinds } from '../../shared/item.constants';
import { yearsBefore } from '../../seed/services/openalex.helper';
import { isAuthorizedKey } from '../mcp-auth.helper';
import { parseSearchPapersRequest } from '../mcp-request.helper';
import { mcpAuth, mcpErrors } from '../mcp.constants';

export const searchPapers = onRequest(
  { secrets: [MCP_SHARED_KEY, OPENALEX_API_KEY, ...optionalSourceSecrets], timeoutSeconds: 60 },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).json({ error: mcpErrors.METHOD_NOT_ALLOWED });

      return;
    }

    if (!isAuthorizedKey(request.header(mcpAuth.KEY_HEADER), MCP_SHARED_KEY.value())) {
      logger.warn('searchPapers rejected a request with a missing or wrong key');
      response.status(401).json({ error: mcpErrors.UNAUTHORIZED });

      return;
    }

    const parsed = parseSearchPapersRequest(request.body);

    if (parsed.error !== undefined) {
      response.status(400).json({ error: parsed.error });

      return;
    }

    const { angle, keywords, limit } = parsed.value;

    try {
      const drafts = await createPaperSource().search({
        angle,
        keywords,
        limit: findLimits.PAPERS_PER_NOTE_QUERY,
        publishedAfter: yearsBefore(new Date(), findLimits.PAPER_YEARS_BACK),
      });

      const papers: Afterword.Types.ISearchPapersResult[] = drafts.slice(0, limit).map((draft) => ({
        externalId: draft.externalId,
        provider: draft.provider,
        kind: itemKinds.PAPER,
        title: draft.title,
        authors: draft.authors,
        url: draft.url,
        publishedAt: draft.publishedAt.toDate().toISOString(),
        text: draft.text,
      }));

      const body: Afterword.Types.ISearchPapersResponse = { papers };
      response.status(200).json(body);
    } catch (error) {
      logger.error('searchPapers failed', { error: error instanceof Error ? error.message : String(error) });
      response.status(502).json({ error: mcpErrors.PAPER_SEARCH_FAILED });
    }
  },
);
