import { Component, Input, Output, OnInit, EventEmitter, ViewChild, ElementRef, SimpleChanges, OnChanges } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { MatAutocompleteSelectedEvent, MatChipInputEvent, MatAutocomplete, MatDialog } from '@angular/material';
import { ToasterService } from 'angular2-toaster';
import { Observable, combineLatest, of } from 'rxjs';
import { skip, map, startWith } from 'rxjs/operators';
import { IsariFastCreationModal } from '../../isari-editor/creation.component';

@Component({
  selector: 'isari-select',
  templateUrl: './isari-select.component.html',
  styleUrls: ['./isari-select.component.css']
})
export class IsariSelectComponent implements OnInit, OnChanges {
  separatorKeysCodes = [ENTER, COMMA];
  max = 20;
  selectControl: FormControl;
  disabled: boolean;
  filteredItems: Observable<any>;
  id: string | undefined;
  open: boolean;

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
  @Input() accessMonitoring: string;
  @Input() am: number = 0;

  @ViewChild('selectInput') selectInput: ElementRef;
  @ViewChild('auto', { read: MatAutocomplete }) autoComplete: MatAutocomplete;

  constructor(private toasterService: ToasterService, private translate: TranslateService, private dialog: MatDialog) {
    this.selectControl = new FormControl();
  }

  add(event: MatChipInputEvent) {
    this.selectInput.nativeElement.value = '';
    this.selectControl.setValue(null);
  }

  displayFn(item) {
    return item ? item.label : undefined;
  }

  selected({ option: { value: item } }: MatAutocompleteSelectedEvent) {

    // open creation modal
    if (item.new === 'ref') {
      this.form.controls[this.name].setValue('');
      this.selectControl.setValue('');
          
      this.dialog.open(IsariFastCreationModal, {
        disableClose: false,
        data: {
          feature: this.create,
          name: item.value
        }
      }).afterClosed().subscribe(createdItem => {
        if (createdItem && createdItem.id) {
          this.selectControl.setValue(createdItem, { emitEvent: false });
          this.form.controls[this.name].setValue(createdItem.id);
          this.id = createdItem.id;
        }
        this.onUpdate.emit({ log: true, path: this.path, type: 'update' });
        
      });

      return;
    }
    else {
      this.form.controls[this.name].setValue(item.id || item.value);
    
      // update id to update the open in new linkzadqsd
      if (item.id)
        this.id = item.id;
         
      this.onUpdate.emit({ log: true, path: this.path, type: 'update' });  
    }
  }

  toggleAccess(val, human = true) {
    this.open = val;
    if (!this.open) {
      this.selectControl.disable();
    } else {
      if (human) {
        this.translate.get('priorityField').subscribe(priorityField => {
          this.toasterService.pop('error', priorityField.title, priorityField.message);
        });
      }
      this.selectControl.enable();
    }
  }

  ngOnChanges(changes) {
    if (changes['am']) {
      if (this.am === 1) {
        this.selectControl.disable();
        this.disabled = true;
      }
      if (this.am === 2) {
        this.selectControl.enable();
        this.disabled = false;
      }
    }
  }

  ngOnInit() {

    // this.lang = this.translate.currentLang;
    this.disabled = this.form.controls[this.name].disabled || this.am === 1;

    this.selectControl.setValue('');
    if (this.disabled) this.selectControl.disable();

    // this.toggleAccess(!this.accessMonitoring, false);

    this.filteredItems =
      combineLatest(
        this.src(this.selectControl.valueChanges.pipe(skip(1), map(x => trans(x, 'fr'))), this.max, this.form),
        this.translate.onLangChange.pipe(
          map((event: LangChangeEvent) => event.lang),
          startWith(this.translate.currentLang)
        )
      ).pipe(
        map(([{ values, reset }, lang]: [{ values: any[], reset: boolean | string }, string]) => {
          let inputValue = this.extensible || this.create ? this.selectControl.value : null
          let x = values.map(item => translateItem(item, lang));
          // reset if asked && only if value && only if autoComplete is Open

          if (reset && reset === this.path && this.selectControl.value && !this.autoComplete.isOpen) {
            this.form.controls[this.name].setValue('');
            this.selectControl.setValue('');
            this.onUpdate.emit({ log: true, path: this.path, type: 'update' });
          }

          if (!inputValue || typeof inputValue !== 'string') return x;

          if (this.extensible) inputValue = { value: inputValue, label: inputValue, new: 'softenum' };
          else inputValue = { value: inputValue, label: 'Créer cette entité', new: 'ref' };

          if (x[0] && x[0].new) x[0] = inputValue;
          else x = [...x, inputValue];
          return x;
        })
      );

    function trans(item, lang = 'fr') {
      return (item && item.label && item.label[lang]) || (item && item.value) || item;
    }

    function translateItem(item, lang = 'fr') {
      const label = (item && item.label && item.label[lang])
        ? item.label[lang]
        : (item && item.label && item.label['fr'])
          ? item.label['fr']
          : (item && item.value) || '';
      return { ...item, label };
    }

    combineLatest(
      this.stringValue,
      this.translate.onLangChange.pipe(
        map((event: LangChangeEvent) => event.lang),
        startWith(this.translate.currentLang)
      )
    ).subscribe(([stringValues, lang]) => {
      const value = this.form.controls[this.name].value;
      this.id = (stringValues.length > 0) && stringValues[0].id;
      this.selectControl.setValue(translateItem(stringValues.length ? stringValues[0] : { value }, lang));
    });
  }

}
