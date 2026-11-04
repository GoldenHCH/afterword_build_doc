import { AsyncPipe, DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Observable,
  ReplaySubject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';

import {
  AlertBannerComponent,
  KindLabelComponent,
  LibraryService,
  LoadingService,
  ScreenToolbarComponent,
  formatShortDate,
} from '../../shared';
import { briefingsConfig, briefingsCopy, entryKindIcons } from '../briefings.constants';
import { entryDomId, findEntry, formatByline, toErrorMessage, toSortedSections } from '../briefings.helper';
import { IBriefingLoadResult } from '../briefings.interfaces';
import { BriefingsService } from '../services/briefings.service';

type IBriefing = Afterword.Firestore.Briefing.IBriefing;
type IBriefingEntry = Afterword.Firestore.Briefing.IBriefingEntry;
type IBriefingSection = Afterword.Firestore.Briefing.IBriefingSection;
type ILibraryItem = Afterword.Firestore.Library.ILibraryItem;

@Component({
  selector: 'aw-briefings-page',
  standalone: true,
  imports: [
    AsyncPipe,
    NgTemplateOutlet,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AlertBannerComponent,
    KindLabelComponent,
    ScreenToolbarComponent,
  ],
  templateUrl: './briefings-page.component.html',
  styleUrl: './briefings-page.component.scss',
})
export class BriefingsPageComponent implements OnInit {
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _document = inject(DOCUMENT);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _briefingsService = inject(BriefingsService);
  private readonly _libraryService = inject(LibraryService);
  private readonly _loadingService = inject(LoadingService);
  private readonly _loadedBriefing$ = new ReplaySubject<IBriefing>(1);
  private _isLoadingShown = false;
  private _isRedirecting = false;
  private _isDestroyed = false;
  private _handledSaveKey = '';

  public readonly copy = briefingsCopy;
  public readonly kindIcons = entryKindIcons;
  public readonly emptySaved = new Map<string, ILibraryItem>();
  public readonly savedByItemId$: Observable<Map<string, ILibraryItem>> = this._libraryService.savedByItemId$.pipe(
    catchError((error) => {
      console.error(error);
      this.actionError = briefingsCopy.LOAD_ERROR;

      return of(this.emptySaved);
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  public briefing: IBriefing | null = null;
  public sections: IBriefingSection[] = [];
  public routeId: string | null = null;
  public isLoaded = false;
  public isBuilding = false;
  public loadError = '';
  public actionError = '';
  public infoMessage = '';
  public readonly pendingItemIds = new Set<string>();

  public get subtitle(): string {
    return this.briefing?.builtAt
      ? `${briefingsCopy.SUBTITLE_BUILT} ${formatShortDate(this.briefing.builtAt)}`
      : briefingsCopy.SUBTITLE_EMPTY;
  }

  public get isBuildDisabled(): boolean {
    return this.isBuilding || this.briefing?.status === 'building';
  }

  public ngOnInit(): void {
    this._destroyRef.onDestroy(() => {
      this._isDestroyed = true;
      this._hideLoading();
    });

    this._route.paramMap
      .pipe(
        map((params) => params.get('id')),
        distinctUntilChanged(),
        tap((routeId) => {
          this.routeId = routeId;
          this.infoMessage = this._briefingsService.takePendingWarning();
          this._showLoading();
        }),
        switchMap((routeId) => this._watchBriefing(routeId)),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe((result) => this._onBriefing(result));

    combineLatest([
      this._loadedBriefing$,
      this.savedByItemId$,
      this._route.queryParamMap.pipe(map((params) => params.get(briefingsConfig.SAVE_QUERY_PARAM))),
    ])
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(([briefing, savedByItemId, itemId]) => {
        if (itemId) {
          void this._handleSaveLink(briefing, savedByItemId, itemId);
        }
      });
  }

  public async onBuild(): Promise<void> {
    if (this.isBuildDisabled) {
      return;
    }

    this.isBuilding = true;
    this.actionError = '';
    this.infoMessage = '';

    try {
      const response = await this._briefingsService.buildNow();

      if (this._isDestroyed) {
        return;
      }

      this._briefingsService.setPendingWarning(response.warning ?? '');
      await this._router.navigate(['/briefings', response.briefingId]);
      this.infoMessage = this._briefingsService.takePendingWarning() || this.infoMessage;
    } catch (error) {
      console.error(error);
      this.actionError = toErrorMessage(error, briefingsCopy.BUILD_ERROR);
    } finally {
      this.isBuilding = false;
    }
  }

  public async onToggleSave(entry: IBriefingEntry, savedItem: ILibraryItem | undefined): Promise<void> {
    const briefingId = this.briefing?.id;

    if (!briefingId || this.pendingItemIds.has(entry.itemId)) {
      return;
    }

    this.actionError = '';

    if (savedItem?.id) {
      await this._unsaveItem(entry.itemId, savedItem.id);

      return;
    }

    await this._saveItem(briefingId, entry.itemId);
  }

  public entryId(itemId: string): string {
    return entryDomId(itemId);
  }

  public byline(entry: IBriefingEntry): string {
    return formatByline(entry);
  }

  public publishedOn(entry: IBriefingEntry): string {
    return entry.publishedAt ? formatShortDate(entry.publishedAt) : '';
  }

  public kindLabel(entry: IBriefingEntry): string {
    return entry.kind === 'post' ? briefingsCopy.POST : briefingsCopy.PAPER;
  }

  private _watchBriefing(routeId: string | null): Observable<IBriefingLoadResult> {
    const briefing$ = routeId ? this._briefingsService.byId$(routeId) : this._briefingsService.latest$;

    return briefing$.pipe(
      map((briefing) => ({ briefing, loadError: '' })),
      catchError((error) => {
        console.error(error);

        return of({ briefing: null, loadError: briefingsCopy.LOAD_ERROR });
      }),
    );
  }

  private _onBriefing(result: IBriefingLoadResult): void {
    const latestId = result.briefing?.id;

    if (!this.routeId && latestId && !this.isBuilding) {
      if (!this._isRedirecting) {
        this._isRedirecting = true;
        void this._router.navigate(['/briefings', latestId], { replaceUrl: true, queryParamsHandling: 'preserve' });
      }

      return;
    }

    this.briefing = result.briefing;
    this.loadError = result.loadError;
    this.sections = toSortedSections(result.briefing);
    this.isLoaded = true;
    this._hideLoading();

    if (result.briefing) {
      this._loadedBriefing$.next(result.briefing);
    }
  }

  private async _handleSaveLink(
    briefing: IBriefing,
    savedByItemId: Map<string, ILibraryItem>,
    itemId: string,
  ): Promise<void> {
    const briefingId = briefing.id;
    const handledKey = `${briefingId}:${itemId}`;

    if (!briefingId || this._handledSaveKey === handledKey) {
      return;
    }

    this._handledSaveKey = handledKey;

    if (!findEntry(briefing, itemId)) {
      this.actionError = briefingsCopy.SAVE_LINK_MISSING;
      await this._clearSaveParam();

      return;
    }

    const isSaved = savedByItemId.has(itemId) || (await this._saveItem(briefingId, itemId));

    if (this._isDestroyed || this._route.snapshot.paramMap.get('id') !== briefingId) {
      return;
    }

    setTimeout(() => this._scrollToEntry(itemId));

    if (isSaved) {
      await this._clearSaveParam();
    }
  }

  private async _saveItem(briefingId: string, itemId: string): Promise<boolean> {
    this.pendingItemIds.add(itemId);

    try {
      await this._libraryService.save(briefingId, itemId);

      return true;
    } catch (error) {
      console.error(error);
      this.actionError = toErrorMessage(error, briefingsCopy.SAVE_ERROR);

      return false;
    } finally {
      this.pendingItemIds.delete(itemId);
    }
  }

  private async _unsaveItem(itemId: string, libraryItemId: string): Promise<void> {
    this.pendingItemIds.add(itemId);

    try {
      await this._libraryService.unsave(libraryItemId);
    } catch (error) {
      console.error(error);
      this.actionError = toErrorMessage(error, briefingsCopy.UNSAVE_ERROR);
    } finally {
      this.pendingItemIds.delete(itemId);
    }
  }

  private _scrollToEntry(itemId: string): void {
    this._document.getElementById(entryDomId(itemId))?.scrollIntoView({ block: 'start' });
  }

  private async _clearSaveParam(): Promise<void> {
    await this._router.navigate([], {
      relativeTo: this._route,
      queryParams: { [briefingsConfig.SAVE_QUERY_PARAM]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private _showLoading(): void {
    this.isLoaded = false;

    if (!this._isLoadingShown) {
      this._isLoadingShown = true;
      this._loadingService.show();
    }
  }

  private _hideLoading(): void {
    if (this._isLoadingShown) {
      this._isLoadingShown = false;
      this._loadingService.hide();
    }
  }
}
