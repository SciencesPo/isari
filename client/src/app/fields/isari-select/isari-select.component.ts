import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { Observable } from 'rxjs/Observable';

const UP_ARROW = 38;
const DOWN_ARROW = 40;
const ENTER = 13;

@Component({
  selector: 'isari-select',
  templateUrl: 'isari-select.component.html',
  styleUrls: ['isari-select.component.css']
})
export class IsariSelectComponent implements OnInit {

  @Input() name: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Output() onUpdate = new EventEmitter<any>();
  @Input() src: Function;
  @Input() extensible = false;
  @Input() stringValue: Observable<string>;

  max = 20;
  values: any[] = [];
  allValues: any[] = [];
  selectControl: FormControl;
  focused: boolean = false;
  disabled: boolean = false;
  currentIndex = -1;
  extend = false;

  constructor() { }

  ngOnInit() {
    this.selectControl = new FormControl({
      value: this.form.controls[this.name].value ? ' ' : '',
      disabled: this.form.controls[this.name].disabled
    });

    this.src(this.selectControl.valueChanges, this.max)
      .subscribe(values => {
        this.values = values;
        this.setExtend();
      });

    this.stringValue.subscribe(stringValue => {
      this.selectControl.setValue(stringValue);
    });

  }

  onFocus($event) {
    this.focused = true;
  }

  onBlur($event) {
    this.focused = false;
  }

  onSelect(idx: number) {
    this.currentIndex = idx;

    this.form.controls[this.name].setValue(this.values[this.currentIndex].id || this.values[this.currentIndex].value);
    this.form.controls[this.name].markAsDirty();

    this.selectControl.setValue(this.values[this.currentIndex].stringValue || this.values[this.currentIndex].label.fr);
    this.selectControl.markAsDirty();

    this.update({});
  }

  onKey($event) {
    if ($event.keyCode === DOWN_ARROW) {
      this.currentIndex = Math.min(this.currentIndex + 1, this.values.length - 1);
    } else if ($event.keyCode === UP_ARROW) {
      this.currentIndex = Math.max(this.currentIndex - 1, 0);
    } else if ($event.keyCode === ENTER && this.currentIndex >= 0) {
      this.onSelect(this.currentIndex);
    }
  }

  createValue() {
    this.form.controls[this.name].setValue(this.selectControl.value);
    this.form.controls[this.name].markAsDirty();
    this.update({});
  }

  update($event) {
    this.onUpdate.emit($event);
    // this.values = this.findValues(); // reset values displayed (for reopening)
  }

  private setExtend() {
    if (this.extensible && this.values.length === 0) {
      this.extend = true;
    } else {
      this.extend = false;
    }
  }

}
