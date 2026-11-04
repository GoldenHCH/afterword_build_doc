import { A11yModule } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { focusableFieldSelector } from './side-panel.constants';

@Component({
  selector: 'aw-side-panel',
  standalone: true,
  imports: [A11yModule, MatIconModule],
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.scss',
})
export class SidePanelComponent implements OnChanges {
  private readonly _document = inject(DOCUMENT);
  private _previouslyFocused: HTMLElement | null = null;

  @ViewChild('panel', { static: true }) private readonly _panel!: ElementRef<HTMLElement>;

  @Input() public open = false;
  @Input({ required: true }) public title = '';
  @Input() public closable = true;
  @Output() public readonly closed = new EventEmitter<void>();

  public ngOnChanges(changes: SimpleChanges): void {
    const openChange = changes['open'];

    if (!openChange || openChange.currentValue === openChange.previousValue) {
      return;
    }

    if (this.open) {
      this._moveFocusIn();
    } else {
      this._restoreFocus();
    }
  }

  @HostListener('document:keydown.escape')
  public onEscape(): void {
    if (this.open) {
      this.onClose();
    }
  }

  public onClose(): void {
    if (this.closable) {
      this.closed.emit();
    }
  }

  private _moveFocusIn(): void {
    this._previouslyFocused = this._document.activeElement as HTMLElement | null;

    setTimeout(() => {
      const panelElement = this._panel.nativeElement;
      const firstField = panelElement.querySelector<HTMLElement>(`.panel-body ${focusableFieldSelector}`);
      const fallback = panelElement.querySelector<HTMLElement>('.panel-close');
      (firstField ?? fallback)?.focus();
    });
  }

  private _restoreFocus(): void {
    this._previouslyFocused?.focus();
    this._previouslyFocused = null;
  }
}
