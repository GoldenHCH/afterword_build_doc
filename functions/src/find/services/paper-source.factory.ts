import { contentSources } from '../find.constants';
import { FallbackPaperSource } from './fallback-paper-source.service';
import { OpenAlexPaperSource } from './openalex-paper-source.service';
import { PaperclipPaperSource } from './paperclip-paper-source.service';
import { IPaperSource } from './paper-source.interfaces';

export function createPaperSource(): IPaperSource {
  if (contentSources.PAPER === 'paperclip') {
    return new FallbackPaperSource(new PaperclipPaperSource(), new OpenAlexPaperSource());
  }

  return new OpenAlexPaperSource();
}
