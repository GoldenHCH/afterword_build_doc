export type IItemDraft = Omit<Afterword.Firestore.Item.IItem, 'id' | 'fetchedAt'>;
