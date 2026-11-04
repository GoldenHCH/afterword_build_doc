export interface IPaperclipSearchRequest {
  query: string;
  num_results: number;
  sources: string[];
  filters: { published_after: string };
  contents: { abstract: boolean };
}

export interface IPaperclipHit {
  id: string;
  title?: string | null;
  url?: string | null;
  doi?: string | null;
  abstract?: string | null;
  published_date?: string | null;
  year?: number | null;
  authors?: string[] | null;
}

export interface IPaperclipSearchResponse {
  papers?: IPaperclipHit[];
}
