import { Component, Input } from '@angular/core';

import { noteKindLabels } from './kind-label.constants';

@Component({
  selector: 'aw-kind-label',
  standalone: true,
  templateUrl: './kind-label.component.html',
  styleUrl: './kind-label.component.scss',
})
export class KindLabelComponent {
  @Input({ required: true }) public kind!: Afterword.Firestore.Note.NoteKind;

  public get label(): string {
    return noteKindLabels[this.kind];
  }
}
