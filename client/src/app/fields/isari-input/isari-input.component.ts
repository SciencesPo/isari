import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'isari-input',
  template: `<div [formGroup]="form"><input [formControlName]="name"></div>`
})
export class IsariInputComponent implements OnInit {

  @Input() name: string;
  @Input() form: FormGroup;

  constructor() { }

  ngOnInit() {
  }

}
