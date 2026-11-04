import { Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

import { PAPERCLIP_API_KEY } from '../../secrets.constants';
import { firstWords, formatIsoDate, normalizeDoi } from '../../seed/services/openalex.helper';
import { itemKinds, itemProviders } from '../../shared/item.constants';
import { IItemDraft } from './item-draft.types';
import { paperclipApi } from './paperclip.constants';
import { IPaperclipHit, IPaperclipSearchRequest, IPaperclipSearchResponse } from './paperclip.interfaces';
import { IPaperQuery, IPaperSource } from './paper-source.interfaces';

export class PaperclipPaperSource implements IPaperSource {
  public async search(query: IPaperQuery): Promise<IItemDraft[]> {
    const apiKey = PAPERCLIP_API_KEY.value();

    if (!apiKey) {
      throw new Error('PAPERCLIP_API_KEY is not set');
    }

    const request: IPaperclipSearchRequest = {
      query: query.angle.trim().length > 0 ? query.angle : query.keywords.join(' '),
      num_results: Math.min(query.limit, paperclipApi.MAX_RESULTS),
      sources: [...paperclipApi.SOURCES],
      filters: { published_after: formatIsoDate(query.publishedAfter) },
      contents: { abstract: true },
    };

    const response = await fetch(`${paperclipApi.BASE_URL}${paperclipApi.SEARCH_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [paperclipApi.API_KEY_HEADER]: apiKey },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(paperclipApi.TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Paperclip returned ${response.status}`);
    }

    const body = (await response.json()) as IPaperclipSearchResponse;
    const hits = body.papers ?? [];
    const drafts = hits
      .map((hit) => this._toDraft(hit, query.publishedAfter))
      .filter((draft): draft is IItemDraft => draft !== null);

    logger.info('Paperclip papers fetched', { returned: hits.length, usable: drafts.length });

    return drafts;
  }

  private _toDraft(hit: IPaperclipHit, publishedAfter: Date): IItemDraft | null {
    const title = hit.title?.trim();
    const doi = normalizeDoi(hit.doi);
    const publishedDate = hit.published_date ?? (hit.year ? `${hit.year}-01-01` : null);
    const externalId = doi ?? hit.id;
    const url = doi ? `https://doi.org/${doi}` : hit.url;

    if (!title || !publishedDate || !externalId || !url) {
      return null;
    }

    const publishedAt = new Date(publishedDate);

    if (Number.isNaN(publishedAt.getTime()) || publishedAt < publishedAfter) {
      return null;
    }

    return {
      kind: itemKinds.PAPER,
      externalId,
      url,
      title,
      text: firstWords(hit.abstract ?? '', paperclipApi.ABSTRACT_WORDS),
      authors: (hit.authors ?? []).map((author) => author.trim()).filter((author) => author.length > 0),
      publishedAt: Timestamp.fromDate(publishedAt),
      provider: itemProviders.PAPERCLIP,
    };
  }
}
