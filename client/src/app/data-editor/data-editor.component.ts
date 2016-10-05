import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'isari-data-editor',
  templateUrl: 'data-editor.component.html',
  styleUrls: ['data-editor.component.css']
})
export class DataEditorComponent implements OnInit, OnChanges {
  form: FormGroup;

  @Input() fields: Array<any>;
  @Input() data;
  @Input() layout;

  constructor(public fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({});

    // save every 1s on change
    // this.form.valueChanges
    //   .debounceTime(1000)
    //   .subscribe((value: string) => {
    //     this.save();
    //   });
  }

  ngOnChanges (changes: SimpleChanges) {
    if (this.data && this.fields && this.fields.length && this.layout) {
      this.createForm();
    }
  }

  save () {
    if (this.form.disabled) {
      return;
    }
    if (!this.form.valid) {
      console.log('Error', this.form);
      return;
    }
    if (this.form.dirty) {
      console.log('save', this.form.value);
    }
  }

  getField (fieldName: string) {
    return this.fields.find(field => field.name === fieldName);
  }

  private createForm () {
    this.fields.forEach(field => {
      this.form.addControl(field.name, new FormControl(
        { value: this.data[field.name] || '', disabled: !this.data.opts.editable },
        this.required(field)
      ));
    });
  }

  private required (field) {
    if (field.requirement && field.requirement === 'mandatory') {
      return Validators.required;
    }
    return null;
  }

}
