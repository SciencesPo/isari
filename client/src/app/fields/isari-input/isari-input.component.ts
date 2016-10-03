import { Component, Input, OnInit, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'isari-input',
  template: `<div [formGroup]="form"><input (blur)="update($event)" [formControlName]="name"></div>`
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
