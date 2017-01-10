import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MdDialogRef, MdDialog } from '@angular/material';
import { ConfirmDialog } from '../fields/confirm.component';

@Component({
  selector: 'isari-data-editor',
  templateUrl: './data-editor.component.html',
  styleUrls: ['./data-editor.component.css']
})
export class DataEditorComponent {
  dialogRef: MdDialogRef<ConfirmDialog>;

  @Input() form: FormGroup;
  @Input() layout;
  @Input() name: string | null;
  @Input() deletable: false;
  @Input() path: string = '';
  @Input() label: string = '';
  @Input() feature: string;
  @Input() multiple: boolean;
  @Input() lang: string;
  @Output() onUpdate = new EventEmitter<any>();
  @Output() onSave = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();

  constructor(private dialog: MdDialog) {}

  update($event) {
    this.onUpdate.emit($event);
  }

  save($event) {
    this.onSave.emit($event);
  }

  delete($event) {
    $event.preventDefault();
    if (this.deletable) {
      this.dialogRef = this.dialog.open(ConfirmDialog, {
        disableClose: false
      });

      this.dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.onDelete.emit($event);
        }
        this.dialogRef = null;
      });
    }
  }

  collapse($event, group) {
    $event.preventDefault();
    group.collapsed = !group.collapsed;
  }

}
