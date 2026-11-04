import * as logger from 'firebase-functions/logger';

import { IItemDraft } from '../../find/services/item-draft.types';
import { OPENALEX_API_KEY } from '../../secrets.constants';
import { openAlexQuery } from './openalex.constants';
import { buildOpenAlexWorksUrl, toPaperDraft, yearsBefore } from './openalex.helper';
import { IOpenAlexWorksResponse } from './openalex.interfaces';

export class OpenAlexSeedService {
  public async searchPapers(angle: string): Promise<IItemDraft[]> {
    const fromPublicationDate = yearsBefore(new Date(), openAlexQuery.YEARS_BACK);
    const url = buildOpenAlexWorksUrl(
      angle,
      fromPublicationDate,
      openAlexQuery.PER_PAGE,
      OPENALEX_API_KEY.value().trim(),
    );
    const response = await fetch(url, { signal: AbortSignal.timeout(openAlexQuery.TIMEOUT_MS) });

    if (!response.ok) {
      logger.error('OpenAlex request failed', { status: response.status, angle });
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
