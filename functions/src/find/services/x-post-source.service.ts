import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

import { collections } from '../../constants';
import { X_BEARER_TOKEN } from '../../secrets.constants';
import { itemKinds, itemProviders } from '../../shared/item.constants';
import { IItemDraft } from './item-draft.types';
import { IPostQuery, IPostSource } from './post-source.interfaces';
import { xApi } from './x.constants';
import { IXPost, IXPostsResponse, IXUsersResponse } from './x.interfaces';

export class XPostSource implements IPostSource {
  private readonly _firestore = getFirestore();

  public async recent(query: IPostQuery): Promise<IItemDraft[]> {
    const sources = await this._loadSources(query.handles);
    const userIds = await this._resolveUserIds(sources);
    const maxResults = Math.min(Math.max(query.limit, xApi.MIN_POSTS_PER_USER), xApi.MAX_POSTS_PER_USER);

    const drafts: IItemDraft[] = [];

    for (const source of sources) {
      const userId = userIds.get(source.handle);

      if (!userId) {
        logger.warn('X user id not found for handle', { handle: source.handle });
        continue;
      }

      const posts = await this._fetchPosts(source.handle, userId, query.since, maxResults);
      drafts.push(...posts.map((post) => this._toDraft(source, post)));
    }

    return drafts
      .sort((first, second) => second.publishedAt.toMillis() - first.publishedAt.toMillis())
      .slice(0, query.limit);
  }

  private async _loadSources(handles: string[]): Promise<Afterword.Firestore.Source.ISource[]> {
    const collection = this._firestore.collection(collections.SOURCES);

    if (handles.length === 0) {
      const snapshot = await collection.get();

      return snapshot.docs.map((document) => document.data() as Afterword.Firestore.Source.ISource);
    }

    const documents = await this._firestore.getAll(...handles.map((handle) => collection.doc(handle)));

    return documents
      .filter((document) => document.exists)
      .map((document) => document.data() as Afterword.Firestore.Source.ISource);
  }

  private async _resolveUserIds(sources: Afterword.Firestore.Source.ISource[]): Promise<Map<string, string>> {
    const userIds = new Map<string, string>();
    const unresolvedHandles: string[] = [];

    for (const source of sources) {
      if (source.xUserId) {
        userIds.set(source.handle, source.xUserId);
      } else {
        unresolvedHandles.push(source.handle);
      }
    }

    for (let start = 0; start < unresolvedHandles.length; start += xApi.USERS_LOOKUP_BATCH_SIZE) {
      const batch = unresolvedHandles.slice(start, start + xApi.USERS_LOOKUP_BATCH_SIZE);
      const response = await this._get<IXUsersResponse>(
        `/users/by?usernames=${batch.join(',')}`,
        batch.join(','),
      );

      for (const user of response.data ?? []) {
        const handle = batch.find((candidate) => candidate.toLowerCase() === user.username.toLowerCase());

        if (!handle) {
          continue;
        }

        userIds.set(handle, user.id);
        await this._firestore.collection(collections.SOURCES).doc(handle).set({ xUserId: user.id }, { merge: true });
      }
    }

    return userIds;
  }

  private async _fetchPosts(handle: string, userId: string, since: Date, maxResults: number): Promise<IXPost[]> {
    const parameters = new URLSearchParams({
      start_time: since.toISOString(),
      max_results: String(maxResults),
      'tweet.fields': 'created_at,public_metrics',
      exclude: 'retweets,replies',
    });
    const response = await this._get<IXPostsResponse>(`/users/${userId}/tweets?${parameters.toString()}`, handle);

    return response.data ?? [];
  }

  private async _get<TResponse>(path: string, handle: string): Promise<TResponse> {
    const response = await fetch(`${xApi.BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${X_BEARER_TOKEN.value()}` },
    });

    if (!response.ok) {
      throw new Error(`X API request failed with status ${response.status} for ${handle}`);
    }

    return (await response.json()) as TResponse;
  }

  private _toDraft(source: Afterword.Firestore.Source.ISource, post: IXPost): IItemDraft {
    return {
      kind: itemKinds.POST,
      provider: itemProviders.X,
      externalId: post.id,
      url: `https://x.com/${source.handle}/status/${post.id}`,
      title: post.text.split(/\s+/).filter(Boolean).slice(0, xApi.TITLE_WORD_COUNT).join(' '),
      text: post.text,
      authors: [source.displayName],
      sourceHandle: source.handle,
      publishedAt: Timestamp.fromDate(new Date(post.created_at)),
    };
  }
}
