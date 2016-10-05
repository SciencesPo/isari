import { Injectable } from '@angular/core';

import { IsariInputComponent } from './isari-input/isari-input.component';
import { IsariSelectComponent } from './isari-select/isari-select.component';

@Injectable()
export class IsariFieldSelectorService {

  constructor() { }

  getInputComponent (field): any {
    if (field.enum) {
      return IsariSelectComponent;
    }
    return IsariInputComponent;
  }

}
