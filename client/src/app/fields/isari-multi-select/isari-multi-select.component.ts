import { Component, Input, EventEmitter, Output, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ENTER, COMMA } from '@angular/cdk/keycodes';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/skip';
import 'rxjs/add/operator/do';
import { TranslateService, LangChangeEvent } from 'ng2-translate';
import { MatChipInputEvent, MatAutocompleteSelectedEvent, MatChipSelectionChange } from '@angular/material';
import { ActivatedRoute } from '@angular/router';

// const ENTER = 13;
const BACKSPACE = 8;
const UP_ARROW = 38;
const DOWN_ARROW = 40;

@Component({
  selector: 'isari-multi-select',
  templateUrl: './isari-multi-select.component.html',
  styleUrls: ['./isari-multi-select.component.css']
})
export class IsariMultiSelectComponent implements OnInit {

  separatorKeysCodes = [ENTER, COMMA];
  max = 20;
  _values = [];
  selectControl: FormControl;
  disabled: boolean;
  filteredItems: Observable<any>;

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

  @ViewChild('selectInput') selectInput: ElementRef;

  constructor(private translate: TranslateService, private route: ActivatedRoute) { }

  add(event: MatChipInputEvent) {
    this.selectInput.nativeElement.value = '';
    this.selectControl.setValue(null);
  }

  displayFn(item) {
    return item ? item.label : undefined;
  }

  selectItem(item) {
    if (!item.id) return;
    const queryMap = this.route.snapshot.queryParams;
    let query = Object.keys(queryMap).map(key => `${key}=${queryMap[key]}`).join('&');
    if (query) query = '?' + query;
    window.open(`/${this.api}/${item.id}${query}`, '_blank');
  }

  selected(event: MatAutocompleteSelectedEvent) {
    this.values = [...this.values, event.option.value];
    this.selectInput.nativeElement.value = '';
    this.selectControl.setValue(null);
    this.form.controls[this.name].markAsDirty();
    this.onUpdate.emit({ log: true, path: this.path, type: 'push' });
  }

  removeValue(value, $event) {
    const removedIndex = this.values.findIndex(v => v === value);
    this.values = this.values.filter(v => v !== value);
    this.form.controls[this.name].markAsDirty();
    this.onUpdate.emit({ log: true, path: this.path, index: removedIndex, type: 'delete' });
  }

  ngOnInit() {
    // this.lang = this.translate.currentLang;
    this.disabled = this.form.controls[this.name].disabled;

    this.selectControl = new FormControl({
      value: '',
      disabled: false
    });

    this.filteredItems =
      Observable.combineLatest(
        this.src(this.selectControl.valueChanges.skip(1).map(x => trans(x, 'fr')), this.max),
        this.translate.onLangChange
          .map((event: LangChangeEvent) => event.lang)
          .startWith(this.translate.currentLang),
        this.extensible ? this.selectControl.valueChanges : Observable.of(null)
      ).map(([{ values }, lang, inputValue]: [{ values: any[] }, string, any]) => {
        let x = values.map(item => translateItem(item, lang));
        if (!inputValue) return x;
        inputValue = { value: inputValue, label: inputValue, new: true };
        if (x[0].new) x[0] = inputValue;
        else x = [inputValue, ...x];
        return x;
      });

    function trans(item, lang = 'fr') {
      return (item && item.label && item.label[lang]) || (item && item.value) || item;
    }

    function translateItem(item, lang = 'fr') {
      const label = (item.label && item.label[lang])
        ? item.label[lang]
        : (item.label && item.label['fr']) ? item.label['fr'] : item.value;
      return { ...item, label };
    }

    Observable.combineLatest(
      this.stringValue,
      this.translate.onLangChange
        .map((event: LangChangeEvent) => event.lang)
        .startWith(this.translate.currentLang)
    ).subscribe(([stringValues, lang]) => {
      this._values = stringValues.map(item => translateItem(item, lang));
    });
  }

  set values(values: any[]) {
    this._values = values;
    this.form.controls[this.name].setValue(values.map(v => v.id || v.value));
  }

  get values() {
    return this._values;
  }

}
