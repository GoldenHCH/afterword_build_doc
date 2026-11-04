import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'aw-side-panel',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.scss',
})
export class SidePanelComponent {
  @Input() public open = false;
  @Input({ required: true }) public title = '';
  @Input() public closable = true;
  @Output() public readonly closed = new EventEmitter<void>();

  public onClose(): void {
    if (this.closable) {
      this.closed.emit();
    }
  }
}
