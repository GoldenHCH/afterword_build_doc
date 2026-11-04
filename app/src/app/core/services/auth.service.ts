import { Injectable } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Observable, distinctUntilChanged, map, shareReplay } from 'rxjs';

import { auth, firestore } from '../firebase';
import { collections } from '../firebase.constants';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _profileEnsuredForUid: string | null = null;

  public readonly user$: Observable<User | null> = new Observable<User | null>((subscriber) =>
    onAuthStateChanged(
      auth,
      (user) => subscriber.next(user),
      (error) => subscriber.error(error),
    ),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  public readonly uid$: Observable<string | null> = this.user$.pipe(
    map((user) => user?.uid ?? null),
    distinctUntilChanged(),
  );

  public currentUid(): string | null {
    return auth.currentUser?.uid ?? null;
  }

  public async signInWithGoogle(): Promise<void> {
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    await this._completeSignIn(credential.user);
  }

  public async signInWithDemo(email: string, password: string): Promise<void> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await this._completeSignIn(credential.user);
  }

  public async ensureProfile(user: User): Promise<void> {
    if (this._profileEnsuredForUid === user.uid) {
      return;
    }

    await this._ensureUserDocument(user);
    this._profileEnsuredForUid = user.uid;
  }

  public async signOut(): Promise<void> {
    this._profileEnsuredForUid = null;
    await signOut(auth);
  }

  private async _completeSignIn(user: User): Promise<void> {
    try {
      await this.ensureProfile(user);
    } catch (error) {
      await this.signOut();
      throw error;
    }
  }

  private async _ensureUserDocument(user: User): Promise<void> {
    const userReference = doc(firestore, collections.USERS, user.uid);
    const existingUser = await getDoc(userReference);

    if (existingUser.exists()) {
      return;
    }

    const email = user.email ?? '';
    await setDoc(userReference, {
      email,
      displayName: user.displayName || email.split('@')[0],
      createdAt: serverTimestamp(),
    });
  }
}
