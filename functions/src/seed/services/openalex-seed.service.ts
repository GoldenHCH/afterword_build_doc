import * as logger from 'firebase-functions/logger';

import { IItemDraft } from '../../find/services/item-draft.types';
import { openAlexQuery } from './openalex.constants';
import { buildOpenAlexWorksUrl, toPaperDraft, yearsBefore } from './openalex.helper';
import { IOpenAlexWorksResponse } from './openalex.interfaces';

export class OpenAlexSeedService {
  public async searchPapers(angle: string): Promise<IItemDraft[]> {
    const fromPublicationDate = yearsBefore(new Date(), openAlexQuery.YEARS_BACK);
    const url = buildOpenAlexWorksUrl(angle, fromPublicationDate);
    const response = await fetch(url, { signal: AbortSignal.timeout(openAlexQuery.TIMEOUT_MS) });

    if (!response.ok) {
      logger.error('OpenAlex request failed', { status: response.status, url });
      throw new Error(`OpenAlex returned ${response.status}`);
    }

    const body = (await response.json()) as IOpenAlexWorksResponse;
    const drafts = (body.results ?? [])
      .map((work) => toPaperDraft(work))
      .filter((draft): draft is IItemDraft => draft !== null);

    logger.info('OpenAlex papers fetched', { angle, returned: body.results?.length ?? 0, usable: drafts.length });

    return drafts;
  }
}
