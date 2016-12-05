import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { matchKeyCombo } from '../utils';

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
  @Input() feature: string;
  @Input() multiple: boolean;
  @Input() saveShortcut: Array<string> = ['Ctrl+s'];
  @Output() onUpdate = new EventEmitter<any>();
  @Output() onSave = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();

  private pressedSaveShortcut: Function;

  constructor() {}

  ngOnInit() {
    this.pressedSaveShortcut = matchKeyCombo(this.saveShortcut);
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown($event) {
    if (this.pressedSaveShortcut($event)) {
      $event.preventDefault();
      this.save($event);
    }
  }

  update($event) {
    this.onUpdate.emit($event);
  }

  save($event) {
    this.onSave.emit($event);
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
