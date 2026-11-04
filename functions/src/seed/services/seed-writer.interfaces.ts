export interface ISeedWriter {
  set(collection: string, id: string, data: object): Promise<void>;
  flush(): Promise<void>;
}
