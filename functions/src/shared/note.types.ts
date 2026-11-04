import { noteKinds, noteSources, noteStatuses } from './note.constants';

export type NoteKind = (typeof noteKinds)[keyof typeof noteKinds];
export type NoteStatus = (typeof noteStatuses)[keyof typeof noteStatuses];
export type NoteSource = (typeof noteSources)[keyof typeof noteSources];
