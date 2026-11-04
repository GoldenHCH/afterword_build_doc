import { FirebaseError } from 'firebase/app';

import { describeLimits, humanCallableErrorCodes } from './notes.constants';
import { IDraftFormValue } from './notes.interfaces';
import { INoteDraft } from './notes.types';

export function parseKeywords(text: string): string[] {
  const keywords = text
    .split(/[,\n]/)
    .map((keyword) => keyword.trim().toLowerCase())
    .filter((keyword) => keyword.length > 0);

  return Array.from(new Set(keywords)).slice(0, describeLimits.MAX_KEYWORDS);
}

export function stripUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

export function callableErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FirebaseError && (humanCallableErrorCodes as readonly string[]).includes(error.code)) {
    return error.message || fallback;
  }

  return fallback;
}

export function draftToFormValue(draft: INoteDraft): IDraftFormValue {
  return {
    kind: draft.kind,
    summary: draft.summary ?? '',
    detail: draft.detail ?? '',
    angle: draft.angle ?? '',
    keywords: (draft.keywords ?? []).join(', '),
    project: draft.project ?? '',
  };
}

export function formValueToDraft(value: IDraftFormValue): INoteDraft {
  return stripUndefined({
    kind: value.kind,
    summary: value.summary.trim(),
    detail: value.detail.trim() || undefined,
    angle: value.angle.trim() || undefined,
    keywords: parseKeywords(value.keywords),
    project: value.project.trim() || undefined,
  });
}
