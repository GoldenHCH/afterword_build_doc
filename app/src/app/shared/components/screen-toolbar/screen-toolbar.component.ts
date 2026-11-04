import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'aw-screen-toolbar',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './screen-toolbar.component.html',
  styleUrl: './screen-toolbar.component.scss',
})
export class ScreenToolbarComponent {
  @Input({ required: true }) public title = '';
  @Input() public subtitle?: string;
  @Input() public backLink?: string;
}
