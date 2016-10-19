import {
  Component,
  Input,
  Output,
  OnInit,
  OnChanges, SimpleChanges,
  EventEmitter
} from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';

import { IsariDataService } from '../isari-data.service';

@Component({
  selector: 'isari-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.css']
})
export class FieldComponent implements OnInit, OnChanges {

  @Input() field: any;
  @Input() form: FormGroup;
  @Input() index: number | null = null;
  @Output() onUpdate = new EventEmitter<any>();

  constructor(private isariDataService: IsariDataService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['form'] && changes['form'].isFirstChange()) {
      this.field.controlType = this.isariDataService.getControlType(this.field);
      if (this.field.enum) {
        this.field.src = this.isariDataService.getEnum(this.field.enum);
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
    if (this.form.controls[this.field.name] instanceof FormArray) {
      this.isariDataService.addFormControlToArray((<FormArray> this.form.controls[this.field.name]), this.field);
      this.update($event);
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
