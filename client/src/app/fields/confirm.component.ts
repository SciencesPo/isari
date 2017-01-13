import { Component } from '@angular/core';
import { MdDialogRef } from '@angular/material';

@Component({
  selector: 'confirm-dialog',
  template: `
  <h1 md-dialog-title>Confirmer la suppression</h1>

  <md-dialog-actions>
    <button (click)="dialogRef.close(true)">Oui</button>
    <button md-dialog-close>Non</button>
  </md-dialog-actions>
  `
})
export class ConfirmDialog {
    constructor(public dialogRef: MdDialogRef<ConfirmDialog>) { }
}