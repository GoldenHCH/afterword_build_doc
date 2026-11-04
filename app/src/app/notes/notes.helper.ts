import { AbstractControl, ValidationErrors } from '@angular/forms';
import { FirebaseError } from 'firebase/app';

import { codeOnlyMessagePattern, describeLimits, humanCallableErrorCodes } from './notes.constants';
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
  const isKnownCode =
    error instanceof FirebaseError && (humanCallableErrorCodes as readonly string[]).includes(error.code);

  if (isKnownCode && error.message && !codeOnlyMessagePattern.test(error.message.trim())) {
    return error.message;
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

export function trimmedRequired(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim().length === 0 ? { required: true } : null;
}

export function trimmedMinLength(minimumLength: number): (control: AbstractControl<string>) => ValidationErrors | null {
  return (control) => {
    const length = control.value.trim().length;

    return length > 0 && length < minimumLength ? { minlength: { requiredLength: minimumLength, actualLength: length } } : null;
  };
}
