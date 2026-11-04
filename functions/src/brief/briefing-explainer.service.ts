import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

import { collections } from '../constants';
import { ItemCacheService } from '../find/services/item-cache.service';
import { ANTHROPIC_API_KEY } from '../secrets.constants';
import { AnthropicClientService } from './anthropic-client.service';
import { explainConfig, explainErrors, explainWarnings } from './brief.constants';
import { IEntryWithText, IExplainOutcome, IModelCompletion } from './brief.interfaces';
import {
  applyExplanation,
  buildExplainPrompt,
  buildSystemPrompt,
  parseExplainResponse,
  validateExplainResponse,
} from './explain.helper';

export class BriefingExplainerService {
  private readonly _firestore = getFirestore();
  private readonly _itemCache = new ItemCacheService();
  private readonly _anthropic = new AnthropicClientService();

  public async explain(briefingId: string): Promise<IExplainOutcome> {
    try {
      return await this._explain(briefingId);
    } catch (error) {
      logger.error('Explain step failed', { briefingId, error: this._messageOf(error) });

      return { explained: false, sectionsExplained: 0, sectionsTotal: 0, warning: explainWarnings.UNAVAILABLE };
    }
  }

  private async _explain(briefingId: string): Promise<IExplainOutcome> {
    const reference = this._firestore.collection(collections.BRIEFINGS).doc(briefingId);
    const snapshot = await reference.get();

    if (!snapshot.exists) {
      logger.warn('Briefing to explain not found', { briefingId });

      return { explained: false, sectionsExplained: 0, sectionsTotal: 0, warning: explainWarnings.NOT_FOUND };
    }

    const { sections } = snapshot.data() as Afterword.Firestore.Briefing.IBriefing;
    const sectionsTotal = sections.filter((section) => section.entries.length > 0).length;

    if (sectionsTotal === 0) {
      return { explained: false, sectionsExplained: 0, sectionsTotal, warning: explainWarnings.NOTHING_TO_EXPLAIN };
    }

    const apiKey = this._readApiKey();

    if (!apiKey) {
      logger.warn('Explain skipped, no Anthropic key', { briefingId, reason: explainErrors.MISSING_KEY });

      return { explained: false, sectionsExplained: 0, sectionsTotal, warning: explainWarnings.UNAVAILABLE };
    }

    const [notesById, textsByItemId] = await Promise.all([this._loadNotes(sections), this._loadTexts(sections)]);

    const results = await Promise.all(
      sections.map((section) => this._explainSection(briefingId, section, notesById, textsByItemId, apiKey)),
    );

    const sectionsExplained = results.filter((result, index) => result !== sections[index]).length;

    if (sectionsExplained > 0) {
      await reference.update({ sections: results });
    }

    logger.info('Explain step finished', { briefingId, sectionsExplained, sectionsTotal });

    if (sectionsExplained === sectionsTotal) {
      return { explained: true, sectionsExplained, sectionsTotal };
    }

    return {
      explained: false,
      sectionsExplained,
      sectionsTotal,
      warning: sectionsExplained === 0 ? explainWarnings.UNAVAILABLE : explainWarnings.PARTIAL,
    };
  }

  private async _explainSection(
    briefingId: string,
    section: Afterword.Firestore.Briefing.IBriefingSection,
    notesById: Map<string, Afterword.Firestore.Note.INote>,
    textsByItemId: Map<string, string>,
    apiKey: string,
  ): Promise<Afterword.Firestore.Briefing.IBriefingSection> {
    const logContext = { briefingId, noteId: section.noteId, entries: section.entries.length };

    try {
      const note = notesById.get(section.noteId);

      if (section.entries.length === 0) {
        return section;
      }

      if (!note) {
        logger.warn('Section kept as is, note not found', logContext);

        return section;
      }

      if (section.entries.length > explainConfig.MAX_ENTRIES_PER_CALL) {
        logger.warn('Section kept as is, too many entries for one call', logContext);

        return section;
      }

      const entriesWithText: IEntryWithText[] = section.entries.map((entry) => ({
        entry,
        text: textsByItemId.get(entry.itemId) ?? '',
      }));
      const system = buildSystemPrompt();
      const userContent = buildExplainPrompt(note, entriesWithText);

      for (let attempt = 1; attempt <= explainConfig.MAX_ATTEMPTS; attempt++) {
        let completion: IModelCompletion;

        try {
          completion = await this._anthropic.complete(apiKey, system, userContent);
        } catch (error) {
          logger.warn('Section model call failed', { ...logContext, attempt, error: this._messageOf(error) });

          continue;
        }

        const response = parseExplainResponse(completion.text);
        const problem = response ? validateExplainResponse(response, section) : 'reply was not valid JSON';

        logger.info('Section model call', {
          ...logContext,
          attempt,
          inputTokens: completion.inputTokens,
          outputTokens: completion.outputTokens,
          ms: completion.latencyMs,
          valid: response !== null && problem === null,
        });

        if (response && problem === null) {
          return applyExplanation(section, response);
        }

        logger.warn('Section reply rejected', { ...logContext, attempt, problem });
      }

      return section;
    } catch (error) {
      logger.error('Section explain failed, keeping fallback', { ...logContext, error: this._messageOf(error) });

      return section;
    }
  }

  private async _loadNotes(sections: Afterword.Firestore.Briefing.IBriefingSection[]): Promise<Map<string, Afterword.Firestore.Note.INote>> {
    const noteIds = [...new Set(sections.map((section) => section.noteId))];
    const references = noteIds.map((noteId) => this._firestore.collection(collections.NOTES).doc(noteId));
    const snapshots = await this._firestore.getAll(...references);

    return new Map(
      snapshots
        .filter((snapshot) => snapshot.exists)
        .map((snapshot): [string, Afterword.Firestore.Note.INote] => [
          snapshot.id,
          { ...(snapshot.data() as Afterword.Firestore.Note.INote), id: snapshot.id },
        ]),
    );
  }

  private async _loadTexts(sections: Afterword.Firestore.Briefing.IBriefingSection[]): Promise<Map<string, string>> {
    const itemIds = [...new Set(sections.flatMap((section) => section.entries.map((entry) => entry.itemId)))];
    const items = await this._itemCache.loadByIds(itemIds);

    return new Map(items.map((item): [string, string] => [item.id as string, item.text]));
  }

  private _readApiKey(): string {
    try {
      return ANTHROPIC_API_KEY.value();
    } catch (error) {
      logger.warn('Anthropic key could not be read', { error: this._messageOf(error) });

      return '';
    }
  }

  private _messageOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
