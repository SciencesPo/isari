import { Injectable } from '@angular/core';

import { IsariInputComponent } from './isari-input/isari-input.component';
import { IsariSelectComponent } from './isari-select/isari-select.component';
import { IsariDateComponent } from './isari-date/isari-date.component';
import { DataEditorComponent } from '../data-editor/data-editor.component';

@Injectable()
export class IsariFieldSelectorService {

  constructor() { }

  getInputComponent (field): any {
    if (field.enum) {
      return IsariSelectComponent;
    }
    if (field.type === 'composed') {
      return DataEditorComponent;
    }
    if (field.type === 'date') {
      return IsariDateComponent;
    }
    return IsariInputComponent;
  }

}
