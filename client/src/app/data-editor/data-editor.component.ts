import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'isari-data-editor',
  templateUrl: 'data-editor.component.html',
  styleUrls: ['data-editor.component.css']
})
export class DataEditorComponent implements OnInit {
  form: FormGroup;
  ready: boolean = false;

  @Input() data;
  @Input() layout;
  @Input() parentForm: FormGroup | null;
  @Input() name: string | null;
  @Output() onUpdate = new EventEmitter<any>();

  constructor(public fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({});
    // if this is a sub component attach the form as a subform
    if (this.parentForm && this.name) {
      this.parentForm.addControl(this.name, this.form);
    }
  }

  update() {
    if (this.form.disabled) {
      return;
    }
    if (!this.form.valid) {
      this.onUpdate.emit(this.form);
    }
    if (this.form.dirty) {
      this.onUpdate.emit(this.form.value);
    }
  }

}
