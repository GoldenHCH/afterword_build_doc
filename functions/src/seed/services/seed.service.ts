import { Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

import { collections, demoUser } from '../../constants';
import { briefingStatuses } from '../../shared/briefing.constants';
import { itemDocId } from '../../shared/item-id.helper';
import { itemKinds } from '../../shared/item.constants';
import { noteSources, noteStatuses } from '../../shared/note.constants';
import briefingJson from '../data/briefing.json';
import notesJson from '../data/notes.json';
import postsJson from '../data/posts.json';
import sourcesJson from '../data/sources.json';
import {
  ISeedBriefing,
  ISeedBriefingEntry,
  ISeedNote,
  ISeedPost,
  ISeedResult,
  ISeedSource,
} from '../seed.interfaces';
import { seedConfig } from '../seed.constants';
import { OpenAlexSeedService } from './openalex-seed.service';
import { ISeedWriter } from './seed-writer.interfaces';

export class SeedService {
  private readonly _notes = notesJson as ISeedNote[];
  private readonly _sources = sourcesJson as ISeedSource[];
  private readonly _posts = postsJson as ISeedPost[];
  private readonly _briefing = briefingJson as unknown as ISeedBriefing;

  constructor(
    private readonly _writer: ISeedWriter,
    private readonly _openAlexSeedService: OpenAlexSeedService,
  ) {}

  public async run(): Promise<ISeedResult> {
    const now = new Date();
    const items = new Map<string, Afterword.Firestore.Item.IItem>();

    this._collectPostItems(items, now);
    this._collectBriefingItems(items, now);

    const cachedItemCount = items.size;

    await this._collectOpenAlexItems(items, now);

    const briefing = this._buildBriefing(now);

    await this._writer.set(collections.USERS, demoUser.UID, this._buildUser(now));

    for (const note of this._buildNotes(now)) {
      await this._writer.set(collections.NOTES, note.id as string, this._withoutId(note));
    }

    for (const source of this._buildSources(now)) {
      await this._writer.set(collections.SOURCES, source.id as string, this._withoutId(source));
    }

    for (const [itemId, item] of items) {
      await this._writer.set(collections.ITEMS, itemId, item);
    }

    await this._writer.set(collections.BRIEFINGS, seedConfig.BRIEFING_ID, briefing);
    await this._writer.flush();

    const result: ISeedResult = {
      users: 1,
      notes: this._notes.length,
      sources: this._sources.length,
      items: items.size,
      briefings: 1,
      briefingSections: briefing.sections.length,
      briefingEntries: briefing.sections.reduce((total, section) => total + section.entries.length, 0),
      openAlexPapers: items.size - cachedItemCount,
    };

    logger.info('Demo seed written', { ...result });

    return result;
  }

  private _buildUser(now: Date): Afterword.Firestore.User.IUser {
    return {
      email: demoUser.EMAIL,
      displayName: demoUser.DISPLAY_NAME,
      createdAt: Timestamp.fromDate(now),
    };
  }

  private _buildNotes(now: Date): Afterword.Firestore.Note.INote[] {
    return this._notes.map((note, index) => {
      const createdAt = new Date(now.getTime() - seedConfig.NOTE_AGE_DAYS[index % seedConfig.NOTE_AGE_DAYS.length] * seedConfig.MILLISECONDS_PER_DAY);

      return {
        id: this._noteId(note.key),
        userId: demoUser.UID,
        kind: note.kind,
        summary: note.summary,
        detail: note.detail,
        angle: note.angle,
        keywords: note.keywords,
        ...(note.project ? { project: note.project } : {}),
        status: noteStatuses.OPEN,
        source: noteSources.MCP,
        createdAt: Timestamp.fromDate(createdAt),
      };
    });
  }

  private _buildSources(now: Date): Afterword.Firestore.Source.ISource[] {
    return this._sources.map((source) => ({
      id: source.handle,
      kind: 'x_account',
      handle: source.handle,
      displayName: source.displayName,
      topics: source.topics,
      weight: source.weight,
      createdAt: Timestamp.fromDate(now),
    }));
  }

  private _collectPostItems(items: Map<string, Afterword.Firestore.Item.IItem>, now: Date): void {
    const displayNames = new Map(this._sources.map((source) => [source.handle, source.displayName]));

    for (const post of this._posts) {
      const displayName = displayNames.get(post.handle) ?? `@${post.handle}`;

      items.set(itemDocId(itemKinds.POST, post.externalId), {
        kind: itemKinds.POST,
        externalId: post.externalId,
        url: post.url,
        title: `${displayName} on X`,
        text: post.text,
        authors: post.authors,
        publishedAt: Timestamp.fromDate(new Date(post.publishedAt)),
        provider: post.provider,
        sourceHandle: post.handle,
        fetchedAt: Timestamp.fromDate(now),
      });
    }
  }

  private _collectBriefingItems(items: Map<string, Afterword.Firestore.Item.IItem>, now: Date): void {
    for (const section of this._briefing.sections) {
      for (const entry of section.entries) {
        items.set(itemDocId(entry.kind, entry.externalId), {
          kind: entry.kind,
          externalId: entry.externalId,
          url: entry.url,
          title: entry.title,
          text: entry.text,
          authors: entry.authors,
          publishedAt: Timestamp.fromDate(new Date(entry.publishedAt)),
          provider: entry.provider,
          ...(entry.sourceHandle ? { sourceHandle: entry.sourceHandle } : {}),
          fetchedAt: Timestamp.fromDate(now),
        });
      }
    }
  }

  private async _collectOpenAlexItems(items: Map<string, Afterword.Firestore.Item.IItem>, now: Date): Promise<void> {
    const draftsPerNote = await Promise.all(this._notes.map((note) => this._openAlexSeedService.searchPapers(note.angle)));

    for (const drafts of draftsPerNote) {
      let added = 0;

      for (const draft of drafts) {
        const itemId = itemDocId(draft.kind, draft.externalId);

        if (items.has(itemId)) {
          continue;
        }

        items.set(itemId, { ...draft, fetchedAt: Timestamp.fromDate(now) });
        added += 1;

        if (added === seedConfig.OPENALEX_PAPERS_PER_NOTE) {
          break;
        }
      }
    }
  }

  private _buildBriefing(now: Date): Afterword.Firestore.Briefing.IBriefing {
    const sections = this._briefing.sections.map((section): Afterword.Firestore.Briefing.IBriefingSection => {
      const note = this._notes.find((candidate) => candidate.key === section.noteKey);

      if (!note) {
        throw new Error(`Briefing section references unknown note key "${section.noteKey}"`);
      }

      return {
        noteId: this._noteId(note.key),
        noteSummary: note.summary,
        noteKind: note.kind,
        entries: section.entries.map((entry) => this._buildBriefingEntry(entry)),
      };
    });

    return {
      userId: demoUser.UID,
      status: briefingStatuses.READY,
      builtAt: Timestamp.fromDate(now),
      sections,
    };
  }

  private _buildBriefingEntry(entry: ISeedBriefingEntry): Afterword.Firestore.Briefing.IBriefingEntry {
    return {
      itemId: itemDocId(entry.kind, entry.externalId),
      rank: entry.rank,
      score: entry.score,
      whyThis: entry.whyThis,
      ...(entry.readingNote ? { readingNote: entry.readingNote } : {}),
      kind: entry.kind,
      title: entry.title,
      url: entry.url,
      authors: entry.authors,
      publishedAt: Timestamp.fromDate(new Date(entry.publishedAt)),
      ...(entry.sourceHandle ? { sourceHandle: entry.sourceHandle } : {}),
    };
  }

  private _noteId(noteKey: string): string {
    return `${seedConfig.NOTE_ID_PREFIX}${noteKey}`;
  }

  private _withoutId<T extends { id?: string }>(document: T): Omit<T, 'id'> {
    const { id: _id, ...rest } = document;

    return rest;
  }
}
