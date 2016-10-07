import {
  Component,
  Input,
  Output,
  OnInit,
  OnChanges, SimpleChanges,
  ViewChild,
  EventEmitter,
  ViewContainerRef,
  ComponentFactoryResolver,
  ComponentRef
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { DataEditorComponent } from '../data-editor/data-editor.component';

import { IsariDataService } from '../isari-data.service';

@Component({
  selector: 'isari-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.css']
})
export class FieldComponent implements OnInit, OnChanges {

  // @TODO : destroy componentReference instance on destroy

  @Input() field: any;
  @Input() form: FormGroup;
  @Input() data: any;
  @Output() onUpdate = new EventEmitter<any>();

  private componentReference: ComponentRef<any>;
  @ViewChild('fieldComponent', {read: ViewContainerRef}) viewContainerRef;

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private isariDataService: IsariDataService) {}

  ngOnInit() {}

  ngOnChanges (changes: SimpleChanges) {
    if (changes['data'].isFirstChange()) {
    // if (this.data) {
    //   console.log(this.data);
      if (this.form.get(this.field.name)) {
        this.form.removeControl(this.field.name);
      }
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.isariDataService.getInputComponent(this.field));
      this.componentReference = this.viewContainerRef.createComponent(componentFactory);


      if (this.componentReference.instance instanceof DataEditorComponent) {
        Object.assign(this.componentReference.instance, {
          layout: this.field.layout,
          parentForm: this.form,
          name: this.field.name,
          onUpdate: this.onUpdate,
          data: Object.assign({}, this.data[this.field.name] || {}, {
            opts: this.data.opts
          })
        });
      } else {
        this.form.addControl(this.field.name, new FormControl({
          value: this.data[this.field.name] || '',
          disabled: this.data.opts && !this.data.opts.editable
        }, this.getValidators(this.field)));
        Object.assign(this.componentReference.instance, {
            form: this.form,
            name: this.field.name,
            onUpdate: this.onUpdate,
            promiseOfEnum: this.field.enum ? this.isariDataService.getEnum(this.field.enum) : null
        });
      }
    }

  }

  private getValidators (field) {
    if (field.requirement && field.requirement === 'mandatory') {
      console.log(field);
      return [Validators.required];
    }
  }

}
