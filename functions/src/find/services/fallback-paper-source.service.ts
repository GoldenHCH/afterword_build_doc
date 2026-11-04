import * as logger from 'firebase-functions/logger';

import { IItemDraft } from './item-draft.types';
import { IPaperQuery, IPaperSource } from './paper-source.interfaces';

export class FallbackPaperSource implements IPaperSource {
  constructor(
    private readonly _primary: IPaperSource,
    private readonly _fallback: IPaperSource,
  ) {}

  public async search(query: IPaperQuery): Promise<IItemDraft[]> {
    try {
      return await this._primary.search(query);
    } catch (error) {
      logger.error('Paperclip search failed, falling back to OpenAlex', {
        error: error instanceof Error ? error.message : String(error),
        angle: query.angle,
      });

      return this._fallback.search(query);
    }
  }
}
