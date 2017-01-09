import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'isari-input',
  templateUrl: './isari-input.component.html'
})
export class IsariInputComponent implements OnInit {

  @Input() name: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Input() description: string;
  @Input() type: string = 'text';
  @Input() min: number;
  @Input() max: number;
  @Input() step: number;
  @Output() onUpdate = new EventEmitter<any>();

  constructor() { }

  update($event) {
    if (this.onUpdate) {
      this.onUpdate.emit($event);
    }
  }

  ngOnInit() {
  }

}
