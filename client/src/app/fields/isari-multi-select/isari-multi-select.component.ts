import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/startWith';
import { TranslateService, LangChangeEvent } from 'ng2-translate';

const ENTER = 13;
const BACKSPACE = 8;

@Component({
  selector: 'isari-multi-select',
  templateUrl: './isari-multi-select.component.html',
  styleUrls: ['./isari-multi-select.component.css']
})
export class IsariMultiSelectComponent implements OnInit {

  max = 20;
  _values = [];
  options: any[] = [];
  selectControl: FormControl;
  empty: boolean = true;
  focused: boolean = false;
  extend = false;
  lang: string;
  disabled: boolean;
  altLabel: string;

  @Input() name: string;
  @Input() path: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Input() requirement: string;
  @Input() description: string;
  @Input() api: string;
  @Output() onUpdate = new EventEmitter<any>();
  @Input() src: Function;
  @Input() create: Function;
  @Input() extensible = false;
  @Input() stringValue: Observable<string[]>;

  constructor(private translate: TranslateService) { }

  update($event) {
    if (this.onUpdate) {
      this.onUpdate.emit($event);
    }
  }

  ngOnInit() {
    this.lang = this.translate.currentLang;
    this.disabled = this.form.controls[this.name].disabled;

    this.setAltLabel();

    this.selectControl = new FormControl({
      value: '',
      disabled: false
    });

    Observable.combineLatest(
      this.src(this.selectControl.valueChanges, this.max),
      this.translate.onLangChange
        .map((event: LangChangeEvent) => event.lang)
        .startWith(this.translate.currentLang)
    ).subscribe(([{values}, lang]: [{values: any[]}, string]) => {
      this.lang = lang;
      this.options = values.map(this.translateItem.bind(this));
      this.setExtend();
    });

    Observable.combineLatest(
      this.stringValue,
      this.translate.onLangChange
        .map((event: LangChangeEvent) => event.lang)
        .startWith(this.translate.currentLang)
    ).subscribe(([stringValues, lang]) => {
      this.lang = lang;
      this.values = stringValues.map(this.translateItem.bind(this));
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
    this.altLabel = '';
  }

  onBlur($event) {
    this.addValue(this.selectControl.value);
    this.empty = this.values.length === 0;
    this.focused = false;
    this.setAltLabel();
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
    this.form.controls[this.name].markAsDirty();
    this.onUpdate.emit({log: true, path: this.path, index: removedIndex, type: 'delete'});
  }

  onSelect(index) {
    this.addValue(this.options[index]);
  }

  addValue(value) {
    if (!this.extensible && !this.findOption(value)) {
      value = null;
    }
    if (value && value.label && this.values.indexOf(value) === -1) { // uniq
      this.values = [value, ...this.values];
      this.form.controls[this.name].markAsDirty();
      this.onUpdate.emit({log: true, path: this.path, type: 'unshift'});
    }
    this.selectControl.setValue('');
  }

  createValue() {
    this.create(this.selectControl.value).subscribe(item => {
      if (typeof item === 'string') {
        item = {
          value: item,
          label: item
        };
      } else {
        if (!item.label && item.name) {
          item.label = item.name;
        }
      }
      this.addValue(item);
    });
  }

  private translateItem (item) {
    let label = item.value;
    if (item.label && item.label[this.lang]) {
      label = item.label[this.lang];
    } else if (item.label && item.label['fr']) {
      label = item.label['fr'];
    }
    return Object.assign({}, item, { label });
  }

  private findOption(item) {
    return this.options.find(option => {
      return (
        (option.value && option.value === item.value) ||
        (option.id && option.id === item.id)
      );
    });
  }

  private setExtend() {
    if (this.extensible
      && (this.options.length !== 1 && !this.options.find(item => item.label.toLowerCase() === this.selectControl.value.toLowerCase()))) {
      this.extend = true;
    } else {
      this.extend = false;
    }
  }

  private setAltLabel () {
    this.altLabel = 'Ajouter une valeur';
  }

}
