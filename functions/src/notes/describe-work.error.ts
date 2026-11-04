import { DescribeWorkFailure } from './notes.types';

export class DescribeWorkError extends Error {
  public constructor(
    public readonly failure: DescribeWorkFailure,
    message: string,
  ) {
    super(message);
    this.name = 'DescribeWorkError';
  }
}
