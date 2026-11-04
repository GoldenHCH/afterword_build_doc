import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipSelectionChange, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

import { AlertBannerComponent } from '../../shared/components/alert-banner/alert-banner.component';
import { ScreenToolbarComponent } from '../../shared/components/screen-toolbar/screen-toolbar.component';
import { SkeletonListComponent } from '../../shared/components/skeleton-list/skeleton-list.component';
import { formatShortDate } from '../../shared/helpers/date.helper';
import { LoadingService } from '../../shared/services/loading.service';
import { filteredEmptyCopy, itemKindIcons, itemKindNames, libraryCopy, libraryFilters } from '../library.constants';
import { formatByline, groupByNote } from '../library.helper';
import { ILibraryGroup } from '../library.interfaces';
import { ILibraryFilter } from '../library.types';
import { LibraryService } from '../services/library.service';

type ILibraryItem = Afterword.Firestore.Library.ILibraryItem;

@Component({
  selector: 'aw-library-page',
  standalone: true,
  imports: [
    AlertBannerComponent,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    ScreenToolbarComponent,
    SkeletonListComponent,
  ],
  templateUrl: './library-page.component.html',
  styleUrl: './library-page.component.scss',
})
export class LibraryPageComponent {
  private readonly _libraryService = inject(LibraryService);
  private readonly _loadingService = inject(LoadingService);
  private _isLoadingShown = false;
  private _items: ILibraryItem[] = [];

  public readonly copy = libraryCopy;
  public readonly filters = libraryFilters;
  public readonly kindIcons = itemKindIcons;
  public readonly kindNames = itemKindNames;
  public readonly formatDate = formatShortDate;
  public readonly byline = formatByline;
  public filter: ILibraryFilter = 'all';
  public groups: ILibraryGroup[] = [];
  public hasItems = false;
  public hasLoaded = false;
  public loadError = '';
  public actionError = '';
  public removingItemIds = new Set<string>();

  constructor() {
    this._loadingService.show();
    this._isLoadingShown = true;
    inject(DestroyRef).onDestroy(() => this._hideLoading());

    this._libraryService.items$.pipe(takeUntilDestroyed()).subscribe({
      next: (items) => {
        this._items = items;
        this.hasItems = items.length > 0;
        this.loadError = '';
        this.hasLoaded = true;
        this._refreshGroups();
        this._hideLoading();
      },
      error: (error) => {
        console.error('Failed to load library', error);
        this.loadError = libraryCopy.LOAD_ERROR;
        this.hasLoaded = true;
        this._hideLoading();
      },
    });
  }

  public get subtitle(): string {
    if (!this.hasLoaded || this.loadError || !this.hasItems) {
      return libraryCopy.SUBTITLE;
    }

    const countLabel = this._items.length === 1 ? libraryCopy.COUNT_ONE : libraryCopy.COUNT_MANY;

    return `${this._items.length} ${countLabel}`;
  }

  public get filteredEmptyText(): string {
    return this.filter === 'all' ? '' : filteredEmptyCopy[this.filter];
  }

  public onFilterChange(event: MatChipSelectionChange, filter: ILibraryFilter): void {
    if (!event.isUserInput) {
      return;
    }

    if (event.selected) {
      this.filter = filter;
      this._refreshGroups();
    } else {
      event.source.select();
    }
  }

  public isRemoving(item: ILibraryItem): boolean {
    return !!item.id && this.removingItemIds.has(item.id);
  }

  public async onRemove(item: ILibraryItem): Promise<void> {
    if (!item.id || this.removingItemIds.has(item.id)) {
      return;
    }

    this.actionError = '';
    this.removingItemIds = new Set(this.removingItemIds).add(item.id);

    try {
      await this._libraryService.unsave(item.id);
    } catch (error) {
      console.error('Failed to remove library item', error);
      this.actionError = libraryCopy.REMOVE_ERROR;
    } finally {
      const remaining = new Set(this.removingItemIds);
      remaining.delete(item.id);
      this.removingItemIds = remaining;
    }
  }

  private _refreshGroups(): void {
    this.groups = groupByNote(this._items, this.filter);
  }

  private _hideLoading(): void {
    if (this._isLoadingShown) {
      this._isLoadingShown = false;
      this._loadingService.hide();
    }
  }
}
