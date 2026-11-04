import { contentSources } from '../find.constants';
import { IPostSource } from './post-source.interfaces';
import { SeededPostSource } from './seeded-post-source.service';
import { XPostSource } from './x-post-source.service';

export function createPostSource(): IPostSource {
  if (contentSources.POST === 'x') {
    return new XPostSource();
  }

  return new SeededPostSource();
}
