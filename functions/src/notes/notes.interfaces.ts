export interface IDescribeWorkDraft {
  kind: Afterword.Firestore.Note.NoteKind;
  summary: string;
  detail?: string | null;
  angle?: string | null;
  keywords: string[];
  project?: string | null;
}
