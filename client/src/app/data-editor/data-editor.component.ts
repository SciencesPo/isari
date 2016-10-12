import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { IsariDataService } from '../isari-data.service';

@Component({
  selector: 'isari-data-editor',
  templateUrl: 'data-editor.component.html',
  styleUrls: ['data-editor.component.css']
})
export class DataEditorComponent {

  @Input() form: FormGroup;
  @Input() layout;
  @Input() name: string | null;
  @Output() onUpdate = new EventEmitter<any>();

  constructor(private isariDataService: IsariDataService) {}

  update($event) {
    this.onUpdate.emit($event);
  }

}
