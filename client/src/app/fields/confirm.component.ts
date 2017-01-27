import { Component } from '@angular/core';
import { MdDialogRef } from '@angular/material';

@Component({
  selector: 'confirm-dialog',
  template: `
  <h1 md-dialog-title>Confirmer la suppression ?</h1>

  <md-dialog-actions>
    <button (click)="dialogRef.close(true)">
    	<md-icon>done</md-icon>
    </button>
    <button md-dialog-close>
    	<md-icon>clear</md-icon>
    </button>
  </md-dialog-actions>
  `,
  styles: [
    `button { outline:none; margin: 0px 30px 0px 30px; border: 2px solid #E6142D; border-radius:100%; background-color: white; cursor:pointer }`,
    `md-dialog-actions { text-align: center }`,
    `md-icon { line-height: 33px }`,
    `h1 { font-family: 'Roboto', sans-serif }`
  ]
})
export class ConfirmDialog {
    constructor(public dialogRef: MdDialogRef<ConfirmDialog>) { }
}