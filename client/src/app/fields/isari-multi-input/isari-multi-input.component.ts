import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

const ENTER = 13;
const BACKSPACE = 8;

@Component({
  selector: 'isari-multi-input',
  templateUrl: './isari-multi-input.component.html',
  styleUrls: ['./isari-multi-input.component.css']
})
export class IsariMultiInputComponent implements OnInit {

  _values = [];
  selectControl: FormControl;
  empty: boolean;

  @Input() name: string;
  @Input() path: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Input() requirement: string;
  @Input() description: string;
  @Output() onUpdate = new EventEmitter<any>();

  constructor() { }

  update($event) {
    if (this.onUpdate) {
      this.onUpdate.emit($event);
    }
  }

  ngOnInit() {
    this.selectControl = new FormControl({
      value: '',
      disabled: false
    });
    this.values = this.form.controls[this.name].value;
  }

  set values(values: string[]) {
    this._values = values;
    this.empty = this.values.length === 0;
    this.form.controls[this.name].setValue(values);
    this.onUpdate.emit({});
  }

  get values() {
    return this._values;
  }

  onBlur($event) {
    this.addValue(this.selectControl.value);
    this.empty = true;
  }

  onFocus($event) {
    this.empty = false;
  }

  onKey($event) {
    if ($event.keyCode === ENTER) {
      this.addValue(this.selectControl.value);
    }
    if ($event.keyCode === BACKSPACE && this.selectControl.value === '' && this.values.length > 0) {
      this.removeValue(this.values[this.values.length - 1], {});
    }
  }

  removeValue(value, $event) {
    const removedIndex = this.values.findIndex(v => v === value);
    this.values = this.values.filter(v => v !== value);

    this.onUpdate.emit({log: true, path: this.path, index: removedIndex, type: 'delete'});
  }

  addValue(value) {
    this.selectControl.setValue('');
    if (value !== '' && this.values.indexOf(value) === -1) { // uniq
      this.values = [...this.values, value];
      this.onUpdate.emit({log: true, path: this.path, type: 'push'});
    }
  }

}
