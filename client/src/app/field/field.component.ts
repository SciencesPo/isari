import { Component, Input, OnInit, ViewChild, ViewContainerRef, ComponentFactoryResolver, ComponentRef } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'isari-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.css']
})
export class FieldComponent implements OnInit {

  // @TODO : destroy componentReference instance on destroy

  @Input() field: any;
  @Input() form: FormGroup;

  private componentReference: ComponentRef<any>;
  @ViewChild('fieldComponent', {read: ViewContainerRef}) viewContainerRef;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

  ngOnInit() {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.field.type);
    this.componentReference = this.viewContainerRef.createComponent(componentFactory);

    Object.assign(this.componentReference.instance, {
        form: this.form,
        name: this.field.name
    });
  }

}
