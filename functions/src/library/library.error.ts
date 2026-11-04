import { LibraryFailure } from './library.types';

export class LibraryError extends Error {
  public constructor(
    public readonly failure: LibraryFailure,
    message: string,
  ) {
    super(message);
    this.name = 'LibraryError';
  }
}
