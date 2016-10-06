import { Directive, OnInit, ViewContainerRef, Input } from '@angular/core';

@Directive({
  selector: '[isariDisabled]'
})
export class DisabledDirective implements OnInit {

  @Input() isariDisabled: boolean;

  // Should be a better way to do this
  // https://github.com/angular/angular/issues/8277
  // https://github.com/angular/material2/pull/1242
  // https://github.com/angular/material2/pull/1211
  // https://github.com/angular/material2/pull/1241

  constructor(private view: ViewContainerRef) {}

  ngOnInit() {
    const component = (<any>this.view)._element.component;
    if (component) {
      component.disabled = this.isariDisabled;
    }
  }

}
