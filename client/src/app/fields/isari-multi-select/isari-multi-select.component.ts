import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { Observable } from 'rxjs/Observable';

const ENTER = 13;
const BACKSPACE = 8;

@Component({
  selector: 'isari-multi-select',
  templateUrl: 'isari-multi-select.component.html',
  styleUrls: ['./isari-multi-select.component.css']
})
export class IsariMultiSelectComponent implements OnInit {

  max = 20;
  _values = [];
  options: any[] = [];
  selectControl: FormControl;
  empty: boolean;
  focused: boolean = false;

  @Input() name: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Input() description: string;
  @Output() onUpdate = new EventEmitter<any>();
  @Input() src: Function;
  @Input() extensible = false;
  @Input() stringValue: Observable<string[]>;

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

    this.src(this.selectControl.valueChanges, this.max)
      .subscribe(values => {
        this.options = values;
        // this.values = values;
        // this.setExtend();
      });

    this.stringValue.subscribe(stringValues => {
      this.values = stringValues;
    });
  }

  set values(values: any[]) {
    this._values = values;
    this.empty = this.values.length === 0;
    this.form.controls[this.name].setValue(values.map(v => v.id || v.value));
  }

  get values() {
    return this._values;
  }

  onFocus($event) {
    this.empty = false;
    this.focused = true;
  }

  onBlur($event) {
    this.addValue(this.selectControl.value);
    this.empty = true;
    this.focused = false;
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
    this.values = this.values.filter(v => v !== value);
    this.form.controls[this.name].markAsDirty();
    this.onUpdate.emit({});
  }

  onSelect(index) {
    this.addValue(this.options[index]);
  }

  addValue(value) {
    this.selectControl.setValue('');
    if (!this.extensible && !this.findOption(value)) {
      value = null;
    }

    if (value && this.values.indexOf(value) === -1) { // uniq
      this.values = [...this.values, value];
      this.form.controls[this.name].markAsDirty();
      this.onUpdate.emit({});
    }
  }

  private findOption(item) {
    return this.options.find(option => (option.value && option.value === item.value) || (option.id && option.id === item.id));
  }

}
