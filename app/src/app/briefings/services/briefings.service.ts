import { Injectable, inject } from '@angular/core';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Observable, of, shareReplay, switchMap } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { firestore, functions } from '../../core/firebase';
import { callableNames, collections } from '../../core/firebase.constants';
import { briefingsConfig } from '../briefings.constants';

type IBriefing = Afterword.Firestore.Briefing.IBriefing;

@Injectable({ providedIn: 'root' })
export class BriefingsService {
  private readonly _authService = inject(AuthService);
  private _pendingWarning = '';

  public readonly latest$: Observable<IBriefing | null> = this._authService.uid$.pipe(
    switchMap((uid) => (uid ? this._watchLatest(uid) : of(null))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  public byId$(briefingId: string): Observable<IBriefing | null> {
    return this._authService.uid$.pipe(switchMap((uid) => (uid ? this._watchById(uid, briefingId) : of(null))));
  }

  public async buildNow(): Promise<Afterword.Types.IBuildBriefingNowResponse> {
    const buildBriefingNow = httpsCallable<
      Afterword.Types.IBuildBriefingNowRequest,
      Afterword.Types.IBuildBriefingNowResponse
    >(functions, callableNames.BUILD_BRIEFING_NOW, { timeout: briefingsConfig.BUILD_TIMEOUT_MS });
    const result = await buildBriefingNow({});

    return result.data;
  }

  public setPendingWarning(warning: string): void {
    this._pendingWarning = warning;
  }

  public takePendingWarning(): string {
    const warning = this._pendingWarning;
    this._pendingWarning = '';

    return warning;
  }

  private _watchLatest(uid: string): Observable<IBriefing | null> {
    const latestQuery = query(
      collection(firestore, collections.BRIEFINGS),
      where('userId', '==', uid),
      orderBy('builtAt', 'desc'),
      limit(1),
    );

    return new Observable<IBriefing | null>((subscriber) =>
      onSnapshot(
        latestQuery,
        (snapshot) => {
          const latestDocument = snapshot.docs[0];
          subscriber.next(latestDocument ? { ...(latestDocument.data() as IBriefing), id: latestDocument.id } : null);
        },
        (error) => subscriber.error(error),
      ),
    );
  }

  private _watchById(uid: string, briefingId: string): Observable<IBriefing | null> {
    return new Observable<IBriefing | null>((subscriber) =>
      onSnapshot(
        doc(firestore, collections.BRIEFINGS, briefingId),
        (snapshot) => {
          const briefing = snapshot.exists() ? (snapshot.data() as IBriefing) : null;
          subscriber.next(briefing && briefing.userId === uid ? { ...briefing, id: snapshot.id } : null);
        },
        (error) => (error.code === 'permission-denied' ? subscriber.next(null) : subscriber.error(error)),
      ),
    );
  }
}
