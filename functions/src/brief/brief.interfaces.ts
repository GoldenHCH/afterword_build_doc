export interface IExplainedEntry {
  itemId: string;
  whyThis: string;
  readingNote: string;
}

export interface IExplainResponse {
  entries: IExplainedEntry[];
  order: string[];
}

export interface IExplainOutcome {
  explained: boolean;
  sectionsExplained: number;
  sectionsTotal: number;
  warning?: string;
}

export interface IEntryWithText {
  entry: Afterword.Firestore.Briefing.IBriefingEntry;
  text: string;
}

export interface IExplainPromptEntry {
  itemId: string;
  kind: string;
  title: string;
  authors: string[];
  publishedAt: string;
  text: string;
}

export interface IExplainNoteContext {
  kind: Afterword.Firestore.Note.NoteKind;
  summary: string;
  detail?: string | null;
  angle?: string | null;
  keywords: string[];
}

export interface IModelCompletion {
  text: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface IAnthropicContentBlock {
  type: string;
  text?: string;
}

export interface IAnthropicMessagesResponse {
  content?: IAnthropicContentBlock[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}
