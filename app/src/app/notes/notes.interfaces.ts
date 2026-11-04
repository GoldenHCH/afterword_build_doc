export interface IDraftFormValue {
  kind: Afterword.Firestore.Note.NoteKind;
  summary: string;
  detail: string;
  angle: string;
  keywords: string;
  project: string;
}
