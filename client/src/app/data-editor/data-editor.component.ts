import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

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
  @Input() path: string = '';
  @Input() label: string = '';
  @Output() onUpdate = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {
  }

  update($event) {
    this.onUpdate.emit($event);
  }

  delete($event) {
    $event.preventDefault();
    if (this.deletable) {
      this.onDelete.emit($event);
    }
  }

  collapse($event, group) {
    $event.preventDefault();
    group.collapsed = !group.collapsed;
  }

}
