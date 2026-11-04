import { Component } from '@angular/core';

import { ScreenToolbarComponent } from '../../shared/components/screen-toolbar/screen-toolbar.component';

@Component({
  selector: 'aw-briefings-page',
  standalone: true,
  imports: [ScreenToolbarComponent],
  templateUrl: './briefings-page.component.html',
})
export class BriefingsPageComponent {}
