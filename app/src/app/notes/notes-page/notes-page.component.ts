import { Component } from '@angular/core';

import { ScreenToolbarComponent } from '../../shared/components/screen-toolbar/screen-toolbar.component';

@Component({
  selector: 'aw-notes-page',
  standalone: true,
  imports: [ScreenToolbarComponent],
  templateUrl: './notes-page.component.html',
})
export class NotesPageComponent {}
