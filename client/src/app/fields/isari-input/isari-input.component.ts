import { Component, Input, EventEmitter, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'isari-input',
  templateUrl: './isari-input.component.html',
  styleUrls: ['./isari-input.component.css']

})
export class IsariInputComponent {

  @Input() name: string;
  @Input() path: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Input() description: string;
  @Input() type: string = 'text';
  @Input() min: number;
  @Input() max: number;
  @Input() step: number;
  @Output() onUpdate = new EventEmitter<any>();
  hasChange: boolean = false;

  constructor() { }

  update($event) {
    if (!this.hasChange) return;
    if (this.type === 'number' && Number.isNaN(this.form.controls[this.name].value)) {
      this.form.controls[this.name].setValue(null);
    }
    if (this.onUpdate) {
      this.onUpdate.emit({ log: true, path: this.path, type: 'update' });
    }
  }

}
