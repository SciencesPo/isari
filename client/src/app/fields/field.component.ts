import {
  Component,
  Input,
  Output,
  OnChanges, SimpleChanges,
  EventEmitter
} from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { IsariDataService } from '../isari-data.service';

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
  @Input() rootFeature: string;

  constructor(private isariDataService: IsariDataService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['form'] && changes['form'].isFirstChange()) {

      this.field.controlType = this.isariDataService.getControlType(this.field);

      const src = this.field.enum || this.field.softenum;
      if (src) {
        this.field.src = this.isariDataService.srcEnumBuilder(src, this.path, this.lang);
        this.field.stringValue = this.isariDataService.getEnumLabel(src, this.path, this.form, this.form.controls[this.field.name].value);
        this.field.create = function (x) { return Observable.of(x); };
      }
      if (this.field.ref) {
        this.field.api = this.isariDataService.getSchemaApi(this.field.ref);
        this.field.src = this.isariDataService.srcForeignBuilder(this.field.ref, this.path, this.rootFeature);
        this.field.stringValue = this.isariDataService.getForeignLabel(this.field.ref, this.form.controls[this.field.name].value);
        this.field.create = this.isariDataService.getForeignCreate(this.field.ref);
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
      return (<FormArray> this.form.controls[this.field.name]).at(this.index);
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
          this.isariDataService.addFormControlToArray((<FormArray> parentFormControl), this.field, data);
          this.update($event);
        });
    }
  }

  // remove item from a multiple field
  remove($event) {
    if (this.form.controls[this.field.name] instanceof FormArray) {
      (<FormArray> this.form.controls[this.field.name]).removeAt(this.index);
      this.update($event);
    }
  }
}
