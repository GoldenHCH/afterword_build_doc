import { itemKinds, itemProviders } from './item.constants';

export type ItemKind = (typeof itemKinds)[keyof typeof itemKinds];
export type ItemProvider = (typeof itemProviders)[keyof typeof itemProviders];
