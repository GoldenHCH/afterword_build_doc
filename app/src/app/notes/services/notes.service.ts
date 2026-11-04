import { Injectable, inject } from '@angular/core';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Observable, of, shareReplay, switchMap } from 'rxjs';

import { firestore, functions } from '../../core/firebase';
import { callableNames, collections } from '../../core/firebase.constants';
import { AuthService } from '../../core/services/auth.service';
import { stripUndefined } from '../notes.helper';
import { INoteDraft } from '../notes.types';

type INote = Afterword.Firestore.Note.INote;

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly _authService = inject(AuthService);

  public readonly openNotes$: Observable<INote[]> = this._authService.uid$.pipe(
    switchMap((uid) => (uid ? this._watchOpenNotes(uid) : of([]))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  public async resolve(noteId: string): Promise<void> {
    await updateDoc(doc(firestore, collections.NOTES, noteId), {
      status: 'resolved',
      resolvedAt: serverTimestamp(),
    });
  }

  public async describe(text: string): Promise<INoteDraft> {
    const describeWork = httpsCallable<Afterword.Types.IDescribeWorkRequest, Afterword.Types.IDescribeWorkResponse>(
      functions,
      callableNames.DESCRIBE_WORK,
    );
    const result = await describeWork({ text });

    return result.data.note;
  }

  public async create(draft: INoteDraft): Promise<void> {
    const uid = this._authService.currentUid();

    if (!uid) {
      throw new Error('Not signed in');
    }

    await addDoc(
      collection(firestore, collections.NOTES),
      stripUndefined({
        ...draft,
        userId: uid,
        status: 'open',
        source: 'app',
        createdAt: serverTimestamp(),
      }),
    );
  }

  private _watchOpenNotes(uid: string): Observable<INote[]> {
    const notesQuery = query(
      collection(firestore, collections.NOTES),
      where('userId', '==', uid),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc'),
    );

    return new Observable<INote[]>((subscriber) =>
      onSnapshot(
        notesQuery,
        (snapshot) =>
          subscriber.next(
            snapshot.docs.map((document) => ({
              ...(document.data({ serverTimestamps: 'estimate' }) as INote),
              id: document.id,
            })),
          ),
        (error) => subscriber.error(error),
      ),
    );
  }
}
