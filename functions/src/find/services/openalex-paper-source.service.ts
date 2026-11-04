import * as logger from 'firebase-functions/logger';

import { buildOpenAlexWorksUrl, toPaperDraft } from '../../seed/services/openalex.helper';
import { IOpenAlexWorksResponse } from '../../seed/services/openalex.interfaces';
import { openAlexPaperSource } from './openalex-paper-source.constants';
import { IItemDraft } from './item-draft.types';
import { keepWithinQuery } from './paper-draft.helper';
import { IPaperQuery, IPaperSource } from './paper-source.interfaces';

export class OpenAlexPaperSource implements IPaperSource {
  public async search(query: IPaperQuery): Promise<IItemDraft[]> {
    const searchText = query.angle.trim().length > 0 ? query.angle : query.keywords.join(' ');
    const perPage = Math.min(query.limit, openAlexPaperSource.MAX_PER_PAGE);
    const url = buildOpenAlexWorksUrl(searchText, query.publishedAfter, perPage);
    const response = await this._fetchWithRetry(url);

    if (!response.ok) {
      logger.error('OpenAlex request failed', { status: response.status, url });
      throw new Error(`OpenAlex returned ${response.status}`);
    }

    const body = (await response.json()) as IOpenAlexWorksResponse;
    const drafts = keepWithinQuery(
      (body.results ?? []).map((work) => toPaperDraft(work)).filter((draft): draft is IItemDraft => draft !== null),
      query,
    );

    logger.info('OpenAlex papers fetched', { returned: body.results?.length ?? 0, usable: drafts.length });

    return drafts;
  }

  private async _fetchWithRetry(url: string): Promise<Response> {
    let response = await fetch(url);

    for (let attempt = 0; attempt < openAlexPaperSource.MAX_RETRIES && response.status === 429; attempt++) {
      const retryAfter = Number(response.headers.get('retry-after')) || openAlexPaperSource.DEFAULT_RETRY_WAIT_SECONDS;

      if (retryAfter > openAlexPaperSource.MAX_RETRY_WAIT_SECONDS) {
        break;
      }

      logger.warn('OpenAlex rate limited, retrying', { retryAfter });
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      response = await fetch(url);
    }

    return response;
  }
}
