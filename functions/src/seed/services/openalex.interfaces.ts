export interface IOpenAlexAuthorship {
  author?: { display_name?: string | null } | null;
}

export interface IOpenAlexWork {
  id?: string | null;
  doi?: string | null;
  title?: string | null;
  publication_year?: number | null;
  publication_date?: string | null;
  authorships?: IOpenAlexAuthorship[] | null;
  abstract_inverted_index?: Record<string, number[]> | null;
}

export interface IOpenAlexWorksResponse {
  results?: IOpenAlexWork[];
}
