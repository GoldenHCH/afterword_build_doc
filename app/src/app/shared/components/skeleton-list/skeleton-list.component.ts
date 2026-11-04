import { Component, Input } from '@angular/core';

@Component({
  selector: 'aw-skeleton-list',
  standalone: true,
  templateUrl: './skeleton-list.component.html',
  styleUrl: './skeleton-list.component.scss',
})
export class SkeletonListComponent {
  @Input() public label = 'Loading';

  @Input() public set count(value: number) {
    this.rows = Array.from({ length: value }, (_, index) => index);
  }

  public rows = [0, 1, 2];
}
