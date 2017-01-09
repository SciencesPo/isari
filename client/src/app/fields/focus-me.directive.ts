import { Directive, ElementRef } from '@angular/core';

@Directive({ 
    selector: '[focusMe]' 
})
export class FocusMeDirective  {
    constructor(private el: ElementRef) {}
    
    setFocus() {
      this.el.nativeElement.focus();
    }
}
