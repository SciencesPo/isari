import {
  Component,
  Input,
  Output,
  OnChanges, SimpleChanges,
  EventEmitter
} from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { of } from 'rxjs';

import { IsariDataService } from '../isari-data.service';
import { ToasterService } from 'angular2-toaster';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'isari-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.css']
})
export class FieldComponent implements OnChanges {

  @Input() field: any;
  @Input() form: FormGroup;
  @Input() index: number | null = null;
  @Input() path: string = '';
  @Input() lang: string;
  @Input() multiple = false;
  @Input() feature: string;
  @Output() onUpdate = new EventEmitter<any>();
  @Output() onError = new EventEmitter<any>();
  @Input() rootFeature: string;
  @Input() am: number = 0;
  _am;

  constructor(private isariDataService: IsariDataService, private toasterService: ToasterService,
    private translate: TranslateService) { }

  toggleAccess(p) {
    this.am = {
      0: 0,
      1: 2,
      2: 1
    }[this.am];
    if (this.am === 2) {
      this.translate.get('priorityField').subscribe(priorityField => {
        this.toasterService.pop('error', priorityField.title, priorityField.message);
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['form'] && changes['form'].isFirstChange()) {
      this.am = this.am || (this.field.accessMonitoring && 1);

      this.field.controlType = this.isariDataService.getControlType(this.field);

      const src = this.field.enum || this.field.softenum;
      if (src) {
        this.field.src = this.isariDataService.srcEnumBuilder(src, this.path, this.lang);
        this.field.stringValue = this.isariDataService.getEnumLabel(src, this.path, this.form, this.form.controls[this.field.name].value);
        this.field.create = function (x) { return of(x); };
      }
      if (this.field.ref) {
        this.field.api = this.isariDataService.getSchemaApi(this.field.ref);
        this.field.src = this.isariDataService.srcForeignBuilder(this.field.ref, this.path, this.rootFeature);
        this.field.stringValue = this.isariDataService.getForeignLabel(this.field.ref, this.form.controls[this.field.name].value);
        this.field.create = this.isariDataService.getForeignCreate(this.field.ref);
      }

      // @TODO : message erreur spécifique. Raf : valeurs initiales fausses (ajout) et pb sur les select + remonter l'info
      if (!this.field.multiple && this.field.type !== 'object') {
        this.invalid(); // 1st check
        this.form.controls[this.field.name].statusChanges.subscribe(status => this.invalid());
      }

    }
  }

  update($event) {
    this.onUpdate.emit($event);
  }

  getField(field) {
    return Object.assign({}, field, {
      multiple: false
    });
  }

  getForm() {
    if (this.form.controls[this.field.name] instanceof FormArray) {
      return (<FormArray>this.form.controls[this.field.name]).at(this.index);
    } else {
      return this.form.controls[this.field.name];
    }
  }

  // add item in a multiple field
  add($event) {
    $event.preventDefault();
    const parentFormControl = this.form.controls[this.field.name];
    if (parentFormControl instanceof FormArray) {
      this.isariDataService.getEmptyDataWith(this.field, this.feature, this.path)
        .then(data => {
          this.isariDataService.addFormControlToArray((<FormArray>parentFormControl), this.field, data);
          this.update({ log: true, path: this.path, type: 'push' });
        });
    }
  }

  // remove item from a multiple field
  remove($event) {
    if (this.form.controls[this.field.name] instanceof FormArray) {
      (<FormArray>this.form.controls[this.field.name]).removeAt(this.index);
      this.update({ log: true, path: this.path.split('.').slice(0, -1).join('.'), index: this.index, type: 'delete' });
    }
  }

  cumulError($event) {
    this.onError.emit($event);
  }

  private invalid() {
    const err = { path: this.path };
    if (this.form.controls[this.field.name].status === 'INVALID') {
      Object.assign(err, {
        label: this.field.label,
        errors: Object.keys(this.form.controls[this.field.name].errors)
      });
    }
    this.onError.emit(err);
  }
}
