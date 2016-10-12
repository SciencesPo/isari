import { Component, Input, EventEmitter, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'isari-input',
  templateUrl: 'isari-input.component.html'
})
export class IsariInputComponent {

  @Input() name: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Output() onUpdate = new EventEmitter<any>();

  constructor() { }

  update($event) {
    if (this.onUpdate) {
      this.onUpdate.emit($event);
    }
  }

}
