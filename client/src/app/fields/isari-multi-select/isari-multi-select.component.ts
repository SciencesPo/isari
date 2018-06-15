import { Component, Input, EventEmitter, Output, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ENTER, COMMA } from '@angular/cdk/keycodes';

import { Observable, combineLatest, of } from 'rxjs';

import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { MatChipInputEvent, MatAutocompleteSelectedEvent, MatChipSelectionChange, MatAutocompleteTrigger, MatDialog } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { ToasterService } from 'angular2-toaster';
import { skip, map, startWith } from 'rxjs/operators';
import { IsariFastCreationModal } from '../../isari-editor/creation.component';

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
  open: boolean;

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
  @Input() accessMonitoring: string;

  @ViewChild('selectInput') selectInput: ElementRef;
  @ViewChild('selectInput', { read: MatAutocompleteTrigger }) autoComplete: MatAutocompleteTrigger;

  constructor(private toasterService: ToasterService, private translate: TranslateService, private route: ActivatedRoute, private dialog: MatDialog) { }

  add(event: MatChipInputEvent) {
    // settimeout to avoid consider click in list as a blur
    setTimeout(() => {
      this.selectInput.nativeElement.value = '';
      this.selectControl.setValue(null);
    }, 100);
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
    this.selectInput.nativeElement.value = '';
    this.selectControl.setValue(null);
    const selected = event.option.value;

    // avoid double
    const found = this.values.findIndex(item => (selected.value && selected.value === item.value) || (selected.id && selected.id === item.id) || (selected === item)) > -1;
    if (found) return;

    // open creation modal
    if (selected.new === 'ref') {

      this.dialog.open(IsariFastCreationModal, {
        disableClose: false,
        data: {
          feature: this.create,
          name: selected.value
        }
      }).afterClosed().subscribe(createdItem => {
        if (createdItem && createdItem.id) {
          this.values = [...this.values, createdItem];
          this.onUpdate.emit({ log: true, path: this.path, type: 'push' });
        }
      });

      return;
    }

    this.values = [...this.values, selected];
    this.form.controls[this.name].markAsDirty();
    this.onUpdate.emit({ log: true, path: this.path, type: 'push' });
    setTimeout(() => this.autoComplete.openPanel(), 100);
  }

  removeValue(value, $event) {
    const removedIndex = this.values.findIndex(v => v === value);
    this.values = this.values.filter(v => v !== value);
    this.form.controls[this.name].markAsDirty();
    this.onUpdate.emit({ log: true, path: this.path, index: removedIndex, type: 'delete' });
  }

  toggleAccess(val, human = true) {
    this.open = val;
    if (!this.open) {
      this.form.controls[this.name].disable();
    } else {
      if (human) {
        this.translate.get('priorityField').subscribe(priorityField => {
          this.toasterService.pop('error', priorityField.title, priorityField.message);
        });
      }
      this.form.controls[this.name].enable();
    }
    this.disabled = this.form.controls[this.name].disabled;
  }

  ngOnInit() {
    this.toggleAccess(!this.accessMonitoring, false);

    // this.lang = this.translate.currentLang;

    this.selectControl = new FormControl({
      value: '',
      disabled: false
    });

    this.filteredItems =
      combineLatest(
        this.src(this.selectControl.valueChanges.pipe(skip(1), map(x => trans(x, 'fr'))), this.max),
        this.translate.onLangChange.pipe(
          map((event: LangChangeEvent) => event.lang),
          startWith(this.translate.currentLang),
        )
        // this.extensible || this.create
        //   ? this.selectControl.valueChanges.pipe(startWith(''))
        //   : of(null)
      ).pipe(
        map(([{ values }, lang]: [{ values: any[] }, string]) => {
          let inputValue = this.extensible || this.create ? this.selectControl.value : null
          let x = values.map(item => translateItem(item, lang));
          if (!inputValue || typeof inputValue !== 'string') return x;

          if (this.extensible) inputValue = { value: inputValue, label: inputValue, new: 'softenum' };
          else inputValue = { value: inputValue, label: 'Créer cette entité', new: 'ref' };

          if (x.length && x[0].new) x[0] = inputValue;
          else x = [...x, inputValue];
          return x;
        })
      );

    function trans(item, lang = 'fr') {
      return (item && item.label && item.label[lang]) || (item && item.value) || item;
    }

    function translateItem(item, lang = 'fr') {
      const label = (item.label && item.label[lang])
        ? item.label[lang]
        : (item.label && item.label['fr']) ? item.label['fr'] : item.value;
      return { ...item, label };
    }

    combineLatest(
      this.stringValue,
      this.translate.onLangChange.pipe(
        map((event: LangChangeEvent) => event.lang),
        startWith(this.translate.currentLang)
      )
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
