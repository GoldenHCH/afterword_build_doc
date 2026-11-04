export interface IBriefingLoadResult {
  briefing: Afterword.Firestore.Briefing.IBriefing | null;
  loadError: string;
}
