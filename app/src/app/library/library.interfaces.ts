export interface ILibraryGroup {
  key: string;
  title: string;
  items: Afterword.Firestore.Library.ILibraryItem[];
}
