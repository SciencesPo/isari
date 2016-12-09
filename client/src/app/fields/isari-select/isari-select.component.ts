import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/startWith';
import { TranslateService, LangChangeEvent } from 'ng2-translate';

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
  @Input() api: string;
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
  lang: string;
  id: string | undefined;
  lastValidStringValue: any;

  constructor(private translate: TranslateService) { }

  ngOnInit() {
    this.lang = this.translate.currentLang;
    this.selectControl = new FormControl({
      value: this.form.controls[this.name].value ? ' ' : '',
      disabled: this.form.controls[this.name].disabled
    });

    Observable.combineLatest(
      this.src(this.selectControl.valueChanges, this.max, this.form),
      this.translate.onLangChange
        .map((event: LangChangeEvent) => event.lang)
        .startWith(this.translate.currentLang)
    ).subscribe(([{values, reset}, lang]: [{values: any[], reset: boolean}, string]) => {
      this.lang = lang;
      if (reset) {
        this.form.controls[this.name].setValue('');
        this.selectControl.setValue('');
        this.lastValidStringValue = '';
      }
      this.values = values.map(this.translateItem.bind(this));
      this.setExtend();
    });

    Observable.combineLatest(
      this.stringValue,
      this.translate.onLangChange
        .map((event: LangChangeEvent) => event.lang)
        .startWith(this.translate.currentLang)
    ).subscribe(([stringValues, lang]) => {
      this.lang = lang;
      let stringValue = '';
      if (stringValues.length > 0) {
        stringValue = this.translateItem(stringValues[0]).label;
        this.id = stringValues[0].id;
      }
      stringValue = stringValue || this.form.controls[this.name].value;
      this.lastValidStringValue = stringValue;
      this.selectControl.setValue(stringValue);
    });

  }

  onFocus($event) {
    this.focused = true;
  }

  onBlur($event) {
    this.focused = false;
    if (this.lastValidStringValue !== this.selectControl.value && this.selectControl.value !== '') {
      this.selectControl.setValue(this.lastValidStringValue);
    }
  }

  onSelect(idx: number) {
    this.currentIndex = idx;
    const v = this.values[this.currentIndex];
    this.id = v.id;

    this.form.controls[this.name].setValue(v.id || v.value);
    this.form.controls[this.name].markAsDirty();
    this.selectControl.setValue(v.label || v.value || v.id);
    // this.selectControl.markAsDirty();

    this.lastValidStringValue = this.selectControl.value;

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
      this.lastValidStringValue = this.selectControl.value;
    });
  }

  update($event) {
    this.onUpdate.emit($event);
    // this.values = this.findValues(); // reset values displayed (for reopening)
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

  private setExtend() {
    if (this.extensible
      && (
        this.selectControl.value && this.values.length !== 1
        && !this.values.find(item => item.label.toLowerCase() === this.selectControl.value.toLowerCase())
      )
    ) {
      this.extend = true;
    } else {
      this.extend = false;
    }
  }

}
