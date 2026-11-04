declare namespace Afterword.Types {
  type INote = Afterword.Firestore.Note.INote;
  type ILibraryItem = Afterword.Firestore.Library.ILibraryItem;

  interface IDescribeWorkRequest {
    text: string;
  }

  interface IDescribeWorkResponse {
    note: Pick<INote, 'kind' | 'summary' | 'detail' | 'angle' | 'keywords' | 'project'>;
  }

  interface IBuildBriefingNowRequest {}

  interface IBuildBriefingNowResponse {
    briefingId: string;
    warning?: string;
  }

  interface ISaveItemRequest {
    briefingId: string;
    itemId: string;
  }

  interface ISaveItemResponse {
    libraryItemId: string;
  }

  interface IUnsaveItemRequest {
    libraryItemId: string;
  }

  interface IUnsaveItemResponse {}

  interface ISearchLibraryRequest {
    userId: string;
    query?: string;
    noteId?: string;
    limit?: number;
  }

  interface ISearchLibraryItem {
    id: string;
    itemId: string;
    kind: Afterword.Firestore.Item.ItemKind;
    title: string;
    url: string;
    authors: string[];
    publishedAt: string;
    sourceHandle?: string;
    noteId?: string;
    noteSummary?: string;
    briefingId?: string;
    keywords: string[];
    whyThis: string;
    savedAt: string;
  }

  interface ISearchLibraryResponse {
    items: ISearchLibraryItem[];
  }

  interface ISearchPapersRequest {
    angle: string;
    keywords?: string[];
    limit?: number;
  }

  interface ISearchPapersResult {
    externalId: string;
    provider: Afterword.Firestore.Item.ItemProvider;
    kind: 'paper';
    title: string;
    authors: string[];
    url: string;
    publishedAt: string;
    text: string;
  }

  interface ISearchPapersResponse {
    papers: ISearchPapersResult[];
  }

  interface ISeedDemoRequest {}

  interface ISeedDemoResponse {
    users: number;
    notes: number;
    sources: number;
    items: number;
    briefings: number;
  }
}
