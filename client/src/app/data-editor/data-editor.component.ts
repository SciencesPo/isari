import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { ConfirmDialog } from '../fields/confirm.component';
import { StorageService } from '../storage.service';
import { ToasterService } from 'angular2-toaster';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'isari-data-editor',
  templateUrl: './data-editor.component.html',
  styleUrls: ['./data-editor.component.css']
})
export class DataEditorComponent implements OnChanges {
  dialogRef: MatDialogRef<ConfirmDialog>;

  @Input() form: FormGroup;
  @Input() layout;
  @Input() name: string | null;
  @Input() deletable: false;
  @Input() path: string = '';
  @Input() label: string = '';
  @Input() feature: string;
  @Input() multiple: boolean;
  @Input() lang: string;
  @Input() differences: number;
  @Output() onUpdate = new EventEmitter<any>();
  @Output() onSave = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onError = new EventEmitter<any>();
  @Input() accessMonitoring: string;
  @Input() am: number = 0;

  constructor(
    private storageService: StorageService,
    private dialog: MatDialog
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (this.layout) {
      const collapsableGroups = this.layout
        .filter(group => group.collapsabled)
        .map(group => ({ collapsed: group.collapsed, label: group.label }));
      if (collapsableGroups.length) {
        const storedCollapsed = this.storageService.get('collapsed', this.feature);
        this.layout = this.layout.map(group => storedCollapsed && storedCollapsed[group.label] ? Object.assign(group, storedCollapsed[group.label]) : group);
      }
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
    this.storageService.upsert({ collapsed: group.collapsed, label: group.label }, 'collapsed', this.feature, 'label');
  }

  cumulError($event) {
    this.onError.emit($event);
  }

}
