import { Component, Input, OnInit, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'isari-data-editor',
  templateUrl: 'data-editor.component.html',
  styleUrls: ['data-editor.component.css']
})
export class DataEditorComponent implements OnInit, OnChanges {
  form: FormGroup;
  ready: boolean = false;

  @Input() data;
  @Input() layout;
  @Input() parentForm: FormGroup | null;
  @Input() name: string | null;
  onUpdate: EventEmitter<any>;

  constructor(public fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({});
    // if this is a sub component attach the form as a subform
    if (this.parentForm && this.name) {
      this.parentForm.addControl(this.name, this.form);
    }
  }

  ngOnChanges (changes: SimpleChanges) {
    // if (this.data && this.data.opts) {
    //   this.disabled = !this.data.opts.editable;
    // }
  }

  save() {
    if (this.onUpdate) {
      this.onUpdate.emit({});
    } else {
      console.log('save', this.form);
    }
    // if (this.form.disabled) {
    //   return;
    // }
    // if (!this.form.valid) {
    //   console.log('Error', this.form);
    //   return;
    // }
    // if (this.form.dirty) {
    //   console.log('save', this.form.value);
    // }
  }

}
