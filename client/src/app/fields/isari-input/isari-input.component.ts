import { Component, Input, OnInit, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'isari-input',
  template: `<span [formGroup]="form"><md-input (blur)="update($event)" [formControlName]="name"></md-input></span>`
})
export class IsariInputComponent implements OnInit {

  @Input() name: string;
  @Input() form: FormGroup;
  onUpdate: EventEmitter<any>;

  constructor() { }

  ngOnInit() {
  }

  update($event) {
    this.onUpdate.emit($event);
  }

}
