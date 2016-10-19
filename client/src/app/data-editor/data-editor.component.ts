import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { IsariDataService } from '../isari-data.service';

@Component({
  selector: 'isari-data-editor',
  templateUrl: 'data-editor.component.html',
  styleUrls: ['data-editor.component.css']
})
export class DataEditorComponent implements OnInit {

  @Input() form: FormGroup;
  @Input() layout;
  @Input() name: string | null;
  @Input() deletable: false;
  @Output() onUpdate = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();

  constructor(private isariDataService: IsariDataService) {}

  update($event) {
    this.onUpdate.emit($event);
  }

  delete($event) {
    $event.preventDefault();
    if (this.deletable) {
      this.onDelete.emit($event);
    }
  }

  ngOnInit() {
  }

}
