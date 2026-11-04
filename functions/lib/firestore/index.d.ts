declare namespace Afterword.Firestore {
  type Timestamp = import('@google-cloud/firestore').Timestamp;

  namespace User {
    interface IUser {
      id?: string;
      email: string;
      displayName: string;
      createdAt: Timestamp;
    }
  }

  namespace Note {
    type NoteKind = 'working_on' | 'stuck' | 'question';
    type NoteStatus = 'open' | 'resolved';
    type NoteSource = 'mcp' | 'app';

    interface INote {
      id?: string;
      userId: string;
      kind: NoteKind;
      summary: string;
      detail?: string;
      angle?: string;
      keywords: string[];
      project?: string;
      status: NoteStatus;
      source: NoteSource;
      createdAt: Timestamp;
      resolvedAt?: Timestamp;
      lastFetchedAt?: Timestamp;
      lastFetchedItemIds?: string[];
    }
  }

  namespace Source {
    interface ISource {
      id?: string;
      kind: 'x_account';
      handle: string;
      displayName: string;
      topics: string[];
      weight: number;
      xUserId?: string;
      createdAt: Timestamp;
    }
  }

  namespace Item {
    type ItemKind = 'paper' | 'post';
    type ItemProvider = 'paperclip' | 'openalex' | 'x' | 'seed';

    interface IItem {
      id?: string;
      kind: ItemKind;
      externalId: string;
      url: string;
      title: string;
      text: string;
      authors: string[];
      publishedAt: Timestamp;
      provider: ItemProvider;
      sourceHandle?: string;
      fetchedAt: Timestamp;
    }

    interface IItemSnapshot {
      kind: ItemKind;
      title: string;
      url: string;
      authors: string[];
      publishedAt: Timestamp;
      sourceHandle?: string;
    }
  }

  namespace Briefing {
    type BriefingStatus = 'building' | 'ready' | 'failed';

    interface IBriefingEntry extends Item.IItemSnapshot {
      itemId: string;
      rank: number;
      score: number;
      whyThis: string;
      readingNote?: string;
    }

    interface IBriefingSection {
      noteId: string;
      noteSummary: string;
      noteKind: Note.NoteKind;
      entries: IBriefingEntry[];
    }

    interface IBriefing {
      id?: string;
      userId: string;
      status: BriefingStatus;
      builtAt: Timestamp;
      sentAt?: Timestamp;
      providerMessageId?: string;
      error?: string;
      sections: IBriefingSection[];
    }
  }

  namespace Library {
    interface ILibraryItem extends Item.IItemSnapshot {
      id?: string;
      userId: string;
      itemId: string;
      noteId?: string;
      noteSummary?: string;
      briefingId?: string;
      keywords: string[];
      whyThis: string;
      savedAt: Timestamp;
    }
  }
}
