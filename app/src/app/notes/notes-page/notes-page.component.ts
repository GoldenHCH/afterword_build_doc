import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AlertBannerComponent } from '../../shared/components/alert-banner/alert-banner.component';
import { KindLabelComponent } from '../../shared/components/kind-label/kind-label.component';
import { ScreenToolbarComponent } from '../../shared/components/screen-toolbar/screen-toolbar.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { formatShortDate } from '../../shared/helpers/date.helper';
import { LoadingService } from '../../shared/services/loading.service';
import { DescribePanelComponent } from '../describe-panel/describe-panel.component';
import { noteSourceDisplay, notesCopy } from '../notes.constants';
import { NotesService } from '../services/notes.service';

type INote = Afterword.Firestore.Note.INote;

@Component({
  selector: 'aw-notes-page',
  standalone: true,
  imports: [
    AlertBannerComponent,
    DescribePanelComponent,
    KindLabelComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ScreenToolbarComponent,
    SkeletonListComponent,
  ],
  templateUrl: './notes-page.component.html',
  styleUrl: './notes-page.component.scss',
})
export class NotesPageComponent {
  private readonly _notesService = inject(NotesService);
  private readonly _loadingService = inject(LoadingService);
  private _isLoadingShown = false;

  public readonly copy = notesCopy;
  public readonly sourceDisplay = noteSourceDisplay;
  public readonly formatDate = formatShortDate;
  public notes: INote[] = [];
  public hasLoaded = false;
  public loadError = '';
  public actionError = '';
  public isDescribeOpen = false;
  public resolvingNoteIds = new Set<string>();

  public get subtitle(): string {
    if (!this.hasLoaded || this.loadError || this.notes.length === 0) {
      return notesCopy.SUBTITLE;
    }

    const countLabel = this.notes.length === 1 ? notesCopy.COUNT_ONE : notesCopy.COUNT_MANY;

    return `${this.notes.length} ${countLabel}`;
  }

  constructor() {
    this._loadingService.show();
    this._isLoadingShown = true;
    inject(DestroyRef).onDestroy(() => this._hideLoading());

    this._notesService.openNotes$.pipe(takeUntilDestroyed()).subscribe({
      next: (notes) => {
        this.notes = notes;
        this.loadError = '';
        this.hasLoaded = true;
        this._hideLoading();
      },
      error: (error) => {
        console.error('Failed to load notes', error);
        this.loadError = notesCopy.LOAD_ERROR;
        this.hasLoaded = true;
        this._hideLoading();
      },
    });
  }

  public onOpenDescribe(): void {
    this.isDescribeOpen = true;
  }

  public onCloseDescribe(): void {
    this.isDescribeOpen = false;
  }

  public isResolving(note: INote): boolean {
    return !!note.id && this.resolvingNoteIds.has(note.id);
  }

  public async onResolve(note: INote): Promise<void> {
    if (!note.id || this.resolvingNoteIds.has(note.id)) {
      return;
    }

    this.actionError = '';
    this.resolvingNoteIds = new Set(this.resolvingNoteIds).add(note.id);

    try {
      await this._notesService.resolve(note.id);
    } catch (error) {
      console.error('Failed to resolve note', error);
      this.actionError = notesCopy.RESOLVE_ERROR;
    } finally {
      const remaining = new Set(this.resolvingNoteIds);
      remaining.delete(note.id);
      this.resolvingNoteIds = remaining;
    }
  }

  private _hideLoading(): void {
    if (this._isLoadingShown) {
      this._isLoadingShown = false;
      this._loadingService.hide();
    }
  }
}
