import { Component, Input, Output, OnInit, EventEmitter, ViewChild, ElementRef, SimpleChanges, OnChanges } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/skip';
import { TranslateService, LangChangeEvent } from 'ng2-translate';

const UP_ARROW = 38;
const DOWN_ARROW = 40;
const ENTER = 13;

@Component({
  selector: 'isari-select',
  templateUrl: './isari-select.component.html',
  styleUrls: ['./isari-select.component.css']
})
export class IsariSelectComponent implements OnInit, OnChanges {

  @Input() name: string;
  @Input() path: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Input() requirement: string;
  @Input() description: string;
  @Input() src: Function;
  @Input() api: string;
  @Input() extensible = false;
  @Input() stringValue: Observable<any>;
  @Input() create: Function;
  @Output() onUpdate = new EventEmitter<any>();
  @Input() showLink: boolean = true;

  max = 20;
  skip = 0;
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
  noblur: boolean = false;

  @ViewChild('search') inputElement: ElementRef;

  constructor(private translate: TranslateService) { }

  ngOnInit() {
    this.lang = this.translate.currentLang;

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

  ngOnChanges(changes: SimpleChanges) {

    if (changes['name']) {
      this.selectControl = new FormControl({
        value: this.form.controls[this.name].value ? ' ' : '',
        disabled: this.form.controls[this.name].disabled
      });
    }

    Observable.combineLatest(
      // skip : avoid search query on load
      this.src(this.selectControl.valueChanges.skip(1), this.max, this.form),
      this.translate.onLangChange
        .map((event: LangChangeEvent) => event.lang)
        .startWith(this.translate.currentLang)
    ).subscribe(([{values, reset}, lang]: [{values: any[], reset: string | boolean}, string]) => {
      this.lang = lang;
      if (reset && reset === this.path) {
        this.form.controls[this.name].setValue('');
        this.selectControl.setValue('');
        this.lastValidStringValue = '';
        this.update({log: true, path: this.path, type: 'update'});
      }
      this.allValues = values;
      this.skip = 0;
      this.values = this.allValues.slice(this.skip, this.max).map(this.translateItem.bind(this));
      this.setExtend();
    });

  }

  onFocus($event) {
    // force reload of values https://github.com/SciencesPo/isari/issues/132
    if (this.selectControl.value === '' && !this.noblur) {
      (<EventEmitter<any>>this.selectControl.valueChanges).emit(' ');
      (<EventEmitter<any>>this.selectControl.valueChanges).emit(''); // maybe useless
    }
    this.noblur = false;
    this.focused = true;
  }

  onBlur($event) {
    if (this.noblur) {
      this.inputElement.nativeElement.focus();
      return;
    }
    this.focused = false;
    if (this.selectControl.value === '') {
      this.update({log: true, path: this.path, type: 'update', value: ''});
      this.form.controls[this.name].setValue('');
    }
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

    this.update({log: true, path: this.path, type: 'update'});
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
      this.update({log: true, path: this.path, type: 'update'});
      this.lastValidStringValue = this.selectControl.value;
      this.selectControl.setValue(item.name || item);
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

  paginate (direction: number) {
    if (direction > 0) this.skip += this.max;
    if (direction < 0) this.skip -= this.max;
    this.values = this.allValues.slice(this.skip, this.skip + this.max).map(this.translateItem.bind(this));
    this.noblur = true;
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
