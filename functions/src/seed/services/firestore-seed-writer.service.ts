import { getFirestore, WriteBatch } from 'firebase-admin/firestore';

import { seedConfig } from '../seed.constants';
import { ISeedWriter } from './seed-writer.interfaces';

export class FirestoreSeedWriter implements ISeedWriter {
  private readonly _firestore = getFirestore();
  private _batch: WriteBatch = this._firestore.batch();
  private _pendingWrites = 0;

  public async set(collection: string, id: string, data: object): Promise<void> {
    this._batch.set(this._firestore.collection(collection).doc(id), data, { merge: true });
    this._pendingWrites += 1;

    if (this._pendingWrites >= seedConfig.MAX_BATCH_WRITES) {
      await this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this._pendingWrites === 0) {
      return;
    }

    await this._batch.commit();
    this._batch = this._firestore.batch();
    this._pendingWrites = 0;
  }
}
