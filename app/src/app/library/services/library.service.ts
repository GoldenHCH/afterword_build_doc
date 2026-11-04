import { Injectable, inject } from '@angular/core';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Observable, map, of, shareReplay, switchMap } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { firestore, functions } from '../../core/firebase';
import { callableNames, collections } from '../../core/firebase.constants';

type ILibraryItem = Afterword.Firestore.Library.ILibraryItem;

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly _authService = inject(AuthService);

  public readonly items$: Observable<ILibraryItem[]> = this._authService.uid$.pipe(
    switchMap((uid) => (uid ? this._watchItems(uid) : of([]))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  public readonly savedByItemId$: Observable<Map<string, ILibraryItem>> = this.items$.pipe(
    map((items) => new Map(items.map((item) => [item.itemId, item] as const))),
  );

  public readonly savedItemIds$: Observable<Set<string>> = this.savedByItemId$.pipe(
    map((savedByItemId) => new Set(savedByItemId.keys())),
  );

  public async save(briefingId: string, itemId: string): Promise<string> {
    const saveItem = httpsCallable<Afterword.Types.ISaveItemRequest, Afterword.Types.ISaveItemResponse>(
      functions,
      callableNames.SAVE_ITEM,
    );
    const result = await saveItem({ briefingId, itemId });

    return result.data.libraryItemId;
  }

  public async unsave(libraryItemId: string): Promise<void> {
    const unsaveItem = httpsCallable<Afterword.Types.IUnsaveItemRequest, Afterword.Types.IUnsaveItemResponse>(
      functions,
      callableNames.UNSAVE_ITEM,
    );
    await unsaveItem({ libraryItemId });
  }

  private _watchItems(uid: string): Observable<ILibraryItem[]> {
    const libraryQuery = query(
      collection(firestore, collections.LIBRARY),
      where('userId', '==', uid),
      orderBy('savedAt', 'desc'),
    );

    return new Observable<ILibraryItem[]>((subscriber) =>
      onSnapshot(
        libraryQuery,
        (snapshot) =>
          subscriber.next(snapshot.docs.map((document) => ({ ...(document.data() as ILibraryItem), id: document.id }))),
        (error) => subscriber.error(error),
      ),
    );
  }
}
