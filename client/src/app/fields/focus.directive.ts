import { Directive, OnInit, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[isariFocus]'
})
export class FocusDirective implements OnInit {

  // Should be a better way to do this
  // https://github.com/angular/angular/issues/8277

  constructor(private view: ViewContainerRef) {}

  ngOnInit(){
    const component = (<any>this.view)._element.component;
    component.focus();
  }

}
