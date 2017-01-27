import { Component } from '@angular/core';
import { MdDialogRef } from '@angular/material';

@Component({
  selector: 'confirm-dialog',
  template: `
  <h1 md-dialog-title style="font-family: 'Roboto', sans-serif">Confirmer la suppression ?</h1>

  <md-dialog-actions style="text-align: center;">
    <button (click)="dialogRef.close(true)" style="margin: 0px 30px 0px 30px; border: 2px solid #E6142D; border-radius:100%; background-color: white; cursor:pointer">
    	<md-icon>done</md-icon>
    </button>
    <button md-dialog-close style="margin: 0px 30px 0px 30px; border: 2px solid #E6142D; border-radius:100%; background-color: white; cursor:pointer">
    	<md-icon>clear</md-icon>
    </button>
  </md-dialog-actions>
  `
})
export class ConfirmDialog {
    constructor(public dialogRef: MdDialogRef<ConfirmDialog>) { }
}