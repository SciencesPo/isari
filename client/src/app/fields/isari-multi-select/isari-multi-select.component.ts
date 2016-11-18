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
  extend = false;
  lang: string;
  disabled: boolean;

  @Input() name: string;
  @Input() form: FormGroup;
  @Input() label: string;
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

    this.selectControl = new FormControl({
      value: '',
      disabled: false
    });

    Observable.combineLatest(
      this.src(this.selectControl.valueChanges, this.max),
      this.translate.onLangChange
        .map((event: LangChangeEvent) => event.lang)
        .startWith(this.translate.currentLang)
    ).subscribe(([items, lang]) => {
      this.lang = lang;
      this.options = (<any[]>items).map(this.translateItem.bind(this));
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
    if (!this.extensible && !this.findOption(value)) {
      value = null;
    }

    if (value && this.values.indexOf(value) === -1) { // uniq
      this.values = [...this.values, value];
      this.form.controls[this.name].markAsDirty();
      this.onUpdate.emit({});
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
    console.log('fo', this.options, item);
    return this.options.find(option => (option.value && option.value === item.value) || (option.id && option.id === item.id));
  }

  private setExtend() {
    if (this.extensible
      && (this.options.length !== 1 && !this.options.find(item => item.label.toLowerCase() === this.selectControl.value.toLowerCase()))) {
      this.extend = true;
    } else {
      this.extend = false;
    }
  }

}
