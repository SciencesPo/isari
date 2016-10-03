import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'isari-data-editor',
  templateUrl: 'data-editor.component.html',
  styleUrls: ['data-editor.component.css']
})
export class DataEditorComponent implements OnInit {
  form: FormGroup;

  @Input() fields: Array<any>;

  constructor(public fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group(this.fields.reduce((acc, cv) => Object.assign(acc, {
      [cv.name]: '' // ['', [Validators.required, speValidator]]
    }), {}));

    // save every 1000ms on change
    this.form.valueChanges
      .debounceTime(1000)
      .subscribe((value: string) => {
        this.save();
      });
  }

  save () {
    if (this.form.valid) {
      console.log('save', this.form.value);
    }
  }

}
