import { createHash } from 'node:crypto';

import { ItemKind } from './item.types';

export function itemDocId(kind: ItemKind, externalId: string): string {
  const hash = createHash('sha1').update(externalId).digest('hex');

  return `${kind}_${hash}`;
}
