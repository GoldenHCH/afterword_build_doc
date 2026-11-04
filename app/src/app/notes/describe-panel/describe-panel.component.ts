import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewEncapsulation, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { AlertBannerComponent } from '../../shared/components/alert-banner/alert-banner.component';
import { SidePanelComponent } from '../../shared/components/side-panel/side-panel.component';
import { describeLimits, describePanelCopy, noteKindOptions } from '../notes.constants';
import { IDraftFormValue } from '../notes.interfaces';
import { callableErrorMessage, draftToFormValue, formValueToDraft } from '../notes.helper';
import { NotesService } from '../services/notes.service';

@Component({
  selector: 'aw-describe-panel',
  standalone: true,
  imports: [
    AlertBannerComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
    SidePanelComponent,
  ],
  templateUrl: './describe-panel.component.html',
  styleUrl: './describe-panel.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DescribePanelComponent implements OnChanges {
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _notesService = inject(NotesService);

  @Input() public open = false;
  @Output() public readonly closed = new EventEmitter<void>();

  public readonly copy = describePanelCopy;
  public readonly kindOptions = noteKindOptions;
  public step: 'describe' | 'draft' = 'describe';
  public isSubmitting = false;
  public saveError = '';

  public readonly describeForm = this._formBuilder.nonNullable.group({
    text: [
      '',
      [
        Validators.required,
        Validators.minLength(describeLimits.MIN_TEXT_CHARS),
        Validators.maxLength(describeLimits.MAX_TEXT_CHARS),
      ],
    ],
  });

  public readonly draftForm = this._formBuilder.nonNullable.group({
    kind: ['working_on' as Afterword.Firestore.Note.NoteKind, Validators.required],
    summary: ['', [Validators.required, Validators.maxLength(describeLimits.MAX_SUMMARY_CHARS)]],
    detail: [''],
    angle: [''],
    keywords: [''],
    project: [''],
  });

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && !this.open) {
      this._reset();
    }
  }

  public onClose(): void {
    if (this.isSubmitting) {
      return;
    }

    this._reset();
    this.closed.emit();
  }

  public onBack(): void {
    this.saveError = '';
    this.step = 'describe';
  }

  public async onDescribe(): Promise<void> {
    if (this.describeForm.invalid || this.isSubmitting) {
      return;
    }

    this.saveError = '';
    this.isSubmitting = true;

    try {
      const draft = await this._notesService.describe(this.describeForm.controls.text.value.trim());
      this.draftForm.reset(draftToFormValue(draft));
      this.step = 'draft';
    } catch (error) {
      console.error('Failed to describe work', error);
      this.saveError = callableErrorMessage(error, this.copy.DESCRIBE_ERROR);
    } finally {
      this.isSubmitting = false;
    }
  }

  public async onSave(): Promise<void> {
    if (this.draftForm.invalid || this.isSubmitting) {
      return;
    }

    this.saveError = '';
    this.isSubmitting = true;

    try {
      await this._notesService.create(formValueToDraft(this.draftForm.getRawValue() as IDraftFormValue));
      this._reset();
      this.closed.emit();
    } catch (error) {
      console.error('Failed to save note', error);
      this.saveError = this.copy.SAVE_ERROR;
    } finally {
      this.isSubmitting = false;
    }
  }

  private _reset(): void {
    this.step = 'describe';
    this.saveError = '';
    this.describeForm.reset();
    this.draftForm.reset({ kind: 'working_on' });
  }
}
