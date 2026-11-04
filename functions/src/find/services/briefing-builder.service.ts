import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

import { collections } from '../../constants';
import { itemKinds } from '../../shared/item.constants';
import { findLimits, scoringWeights } from '../find.constants';
import { briefingBuilder, briefingErrors } from './briefing-builder.constants';
import { IGatheredItem, INoteCandidates, IScoredCandidate, ISourceResult } from './briefing-builder.interfaces';
import {
  buildWhyThis,
  dedupeAcrossNotes,
  matchedKeywords,
  normaliseHandle,
  pickSources,
  scoreItem,
} from './content-scoring.helper';
import { IItemDraft } from './item-draft.types';
import { ItemCacheService } from './item-cache.service';
import { createPaperSource } from './paper-source.factory';
import { createPostSource } from './post-source.factory';

export class BriefingBuilderService {
  private readonly _firestore = getFirestore();
  private readonly _itemCache = new ItemCacheService();

  public async build(userId: string): Promise<string> {
    const now = new Date();
    const notes = await this._loadOpenNotes(userId);
    const sources = await this._loadSources();
    logger.info('Briefing build started', { userId, notes: notes.length, sources: sources.length });

    const sourceWeights = new Map(sources.map((source) => [normaliseHandle(source.handle), source.weight]));
    const gathered = await Promise.all(notes.map((note) => this._gatherItems(note, sources, now)));

    const scoredGroups: INoteCandidates<IScoredCandidate>[] = notes.map((note, index) => ({
      noteId: note.id as string,
      candidates: gathered[index].map(({ itemId, item }) => {
        const sourceWeight =
          item.kind === itemKinds.PAPER
            ? scoringWeights.PAPER_SOURCE_WEIGHT
            : (sourceWeights.get(normaliseHandle(item.sourceHandle ?? '')) ?? 0);

        return { itemId, item, score: scoreItem(note, item, sourceWeight, now), matchedKeywords: matchedKeywords(note, item) };
      }),
    }));

    const dedupedGroups = dedupeAcrossNotes(scoredGroups);
    const sections = notes.map((note, index) => this._buildSection(note, dedupedGroups[index].candidates));
    const keptCount = sections.reduce((total, section) => total + section.entries.length, 0);
    logger.info('Briefing items kept', { userId, kept: keptCount });

    const briefing: Afterword.Firestore.Briefing.IBriefing =
      keptCount > 0
        ? { userId, status: 'ready', builtAt: Timestamp.now(), sections }
        : {
            userId,
            status: 'failed',
            builtAt: Timestamp.now(),
            sections,
            error: notes.length === 0 ? briefingErrors.NO_NOTES : briefingErrors.NO_ITEMS,
          };

    const reference = await this._firestore.collection(collections.BRIEFINGS).add(briefing);
    logger.info('Briefing written', { userId, briefingId: reference.id, status: briefing.status });

    return reference.id;
  }

  public async loadBriefing(briefingId: string): Promise<Afterword.Firestore.Briefing.IBriefing> {
    const snapshot = await this._firestore.collection(collections.BRIEFINGS).doc(briefingId).get();

    return { ...(snapshot.data() as Afterword.Firestore.Briefing.IBriefing), id: snapshot.id };
  }

  private async _loadOpenNotes(userId: string): Promise<Afterword.Firestore.Note.INote[]> {
    const snapshot = await this._firestore
      .collection(collections.NOTES)
      .where('userId', '==', userId)
      .where('status', '==', 'open')
      .get();

    return snapshot.docs
      .map((document) => ({ ...(document.data() as Afterword.Firestore.Note.INote), id: document.id }))
      .sort((first, second) => first.createdAt.toMillis() - second.createdAt.toMillis());
  }

  private async _loadSources(): Promise<Afterword.Firestore.Source.ISource[]> {
    const snapshot = await this._firestore.collection(collections.SOURCES).get();

    return snapshot.docs.map((document) => ({ ...(document.data() as Afterword.Firestore.Source.ISource), id: document.id }));
  }

  private async _gatherItems(
    note: Afterword.Firestore.Note.INote,
    sources: Afterword.Firestore.Source.ISource[],
    now: Date,
  ): Promise<IGatheredItem[]> {
    const noteId = note.id as string;
    const cooldownMillis = findLimits.FETCH_COOLDOWN_HOURS * briefingBuilder.MILLISECONDS_PER_HOUR;
    const cachedItemIds = note.lastFetchedItemIds ?? [];

    if (
      note.lastFetchedAt &&
      now.getTime() - note.lastFetchedAt.toMillis() < cooldownMillis &&
      cachedItemIds.length > 0
    ) {
      const cachedItems = await this._itemCache.loadByIds(cachedItemIds);

      if (cachedItems.length >= cachedItemIds.length) {
        logger.info('Reusing cached items for note', { noteId, items: cachedItems.length });

        return cachedItems.map((item) => ({ itemId: item.id as string, item }));
      }

      logger.warn('Cached items incomplete, fetching again', {
        noteId,
        expected: cachedItemIds.length,
        found: cachedItems.length,
      });
    }

    const publishedAfter = new Date(now.getTime());
    publishedAfter.setFullYear(publishedAfter.getFullYear() - findLimits.PAPER_YEARS_BACK);
    const since = new Date(now.getTime() - findLimits.POST_DAYS_BACK * briefingBuilder.MILLISECONDS_PER_DAY);
    const handles = pickSources(note, sources).map((source) => source.handle);

    const [paperResult, postResult] = await Promise.all([
      this._runSource('papers', noteId, () =>
        createPaperSource().search({
          angle: note.angle ?? note.summary,
          keywords: note.keywords,
          limit: findLimits.PAPERS_PER_NOTE_QUERY,
          publishedAfter,
        }),
      ),
      this._runSource('posts', noteId, () =>
        createPostSource().recent({ handles, since, limit: findLimits.POSTS_PER_NOTE_QUERY }),
      ),
    ]);

    const drafts = [...paperResult.drafts, ...postResult.drafts];
    const itemIds = await this._itemCache.upsert(drafts);
    const fetchedAt = Timestamp.fromDate(now);
    const uniqueItems = new Map<string, IGatheredItem>();

    drafts.forEach((draft, index) => {
      uniqueItems.set(itemIds[index], { itemId: itemIds[index], item: { ...draft, id: itemIds[index], fetchedAt } });
    });

    if (paperResult.succeeded && postResult.succeeded && uniqueItems.size > 0) {
      await this._firestore
        .collection(collections.NOTES)
        .doc(noteId)
        .update({ lastFetchedAt: fetchedAt, lastFetchedItemIds: [...uniqueItems.keys()] });
    }

    return [...uniqueItems.values()];
  }

  private async _runSource(
    label: string,
    noteId: string,
    fetchDrafts: () => Promise<IItemDraft[]>,
  ): Promise<ISourceResult> {
    const startedAt = Date.now();

    try {
      const drafts = await fetchDrafts();
      logger.info('Source fetched', { source: label, noteId, items: drafts.length, ms: Date.now() - startedAt });

      return { drafts, succeeded: true };
    } catch (error) {
      logger.error('Source failed', {
        source: label,
        noteId,
        error: error instanceof Error ? error.message : String(error),
        ms: Date.now() - startedAt,
      });

      return { drafts: [], succeeded: false };
    }
  }

  private _buildSection(
    note: Afterword.Firestore.Note.INote,
    candidates: IScoredCandidate[],
  ): Afterword.Firestore.Briefing.IBriefingSection {
    const byScoreDescending = [...candidates].sort((first, second) => second.score - first.score);
    const papers = byScoreDescending
      .filter((candidate) => candidate.item.kind === itemKinds.PAPER)
      .slice(0, findLimits.PAPERS_KEPT_PER_NOTE);
    const posts = byScoreDescending
      .filter((candidate) => candidate.item.kind === itemKinds.POST)
      .slice(0, findLimits.POSTS_KEPT_PER_NOTE);

    const entries = [...papers, ...posts].map((candidate, index) => this._buildEntry(candidate, index + 1));

    return { noteId: note.id as string, noteSummary: note.summary, noteKind: note.kind, entries };
  }

  private _buildEntry(candidate: IScoredCandidate, rank: number): Afterword.Firestore.Briefing.IBriefingEntry {
    const { item } = candidate;
    const entry: Afterword.Firestore.Briefing.IBriefingEntry = {
      itemId: candidate.itemId,
      kind: item.kind,
      title: item.title,
      url: item.url,
      authors: item.authors,
      publishedAt: item.publishedAt,
      rank,
      score: candidate.score,
      whyThis: buildWhyThis(candidate),
    };

    if (item.sourceHandle) {
      entry.sourceHandle = item.sourceHandle;
    }

    return entry;
  }
}
