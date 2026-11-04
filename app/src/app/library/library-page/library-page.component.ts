import { Component } from '@angular/core';

import { ScreenToolbarComponent } from '../../shared/components/screen-toolbar/screen-toolbar.component';

@Component({
  selector: 'aw-library-page',
  standalone: true,
  imports: [ScreenToolbarComponent],
  templateUrl: './library-page.component.html',
})
export class LibraryPageComponent {}
