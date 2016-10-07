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
  ComponentRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { DataEditorComponent } from '../data-editor/data-editor.component';

import { IsariDataService } from '../isari-data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'isari-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.css']
})
export class FieldComponent implements OnInit, OnChanges {

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
      if (this.form.get(this.field.name)) {
        this.form.removeControl(this.field.name);
      }

      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.isariDataService.getInputComponent(this.field));
      const componentReference = this.viewContainerRef.createComponent(componentFactory);
      const component = componentReference.instance;

      if (component instanceof DataEditorComponent) {
        Object.assign(component, {
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
        Object.assign(component, {
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
      return [Validators.required];
    }
  }

}
