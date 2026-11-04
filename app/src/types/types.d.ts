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

  interface ISearchLibraryResponse {
    items: ILibraryItem[];
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
