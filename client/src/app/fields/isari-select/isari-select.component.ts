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
  @Input() description: string;
  @Input() src: Function;
  @Input() extensible = false;
  @Input() stringValue: Observable<any>;
  @Input() create: Function;
  @Output() onUpdate = new EventEmitter<any>();

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

    this.stringValue.subscribe(stringValues => {
      let stringValue = '';
      if (stringValues.length > 0) {
        stringValue = stringValues[0].label ? stringValues[0].label['fr'] : stringValues[0].value;
      }
      stringValue = stringValue || this.form.controls[this.name].value;
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
    const v = this.values[this.currentIndex];

    this.form.controls[this.name].setValue(v.id || v.value);
    this.form.controls[this.name].markAsDirty();

    this.selectControl.setValue(v.label && v.label['fr'] ? v.label['fr'] : (v.value || v.id));
    // this.selectControl.markAsDirty();

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
    this.create(this.selectControl.value).subscribe(item => {
      this.form.controls[this.name].setValue(item.id || item);
      this.form.controls[this.name].markAsDirty();
      this.update({});
    });
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
