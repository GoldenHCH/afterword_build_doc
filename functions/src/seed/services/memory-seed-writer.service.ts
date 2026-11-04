import { ISeedWriter } from './seed-writer.interfaces';

export class MemorySeedWriter implements ISeedWriter {
  private readonly _collections = new Map<string, Map<string, Record<string, unknown>>>();

  public async set(collection: string, id: string, data: object): Promise<void> {
    const documents = this._collections.get(collection) ?? new Map<string, Record<string, unknown>>();
    documents.set(id, data as Record<string, unknown>);
    this._collections.set(collection, documents);
  }

  public async flush(): Promise<void> {}

  public collectionNames(): string[] {
    return [...this._collections.keys()].sort();
  }

  public documents(collection: string): Array<[string, Record<string, unknown>]> {
    return [...(this._collections.get(collection)?.entries() ?? [])];
  }
}
