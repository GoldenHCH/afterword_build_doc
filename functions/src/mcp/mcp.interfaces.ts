export interface IValidRequest<TValue> {
  value: TValue;
  error?: undefined;
}

export interface IInvalidRequest {
  value?: undefined;
  error: string;
}

export interface IParsedSearchPapers {
  angle: string;
  keywords: string[];
  limit: number;
}

export interface IParsedSearchLibrary {
  userId: string;
  query: string;
  noteId?: string;
  limit: number;
}
