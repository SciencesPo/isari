import { Component } from '@angular/core';
import { MdDialogRef } from '@angular/material';

@Component({
  selector: 'confirm-dialog',
  template: `
  <h1 md-dialog-title>Confirmer la suppression ?</h1>

  <md-dialog-actions>
    <button (click)="dialogRef.close(true)">
    	<div>Oui</div>
    </button>
    <button md-dialog-close>
    	<div>Annuler</div>
    </button>
  </md-dialog-actions>
  `,
  styles: [
    `button { outline:none; margin: 0px 30px 0px 30px; border-radius:10%; background-color: white; cursor:pointer }`,
    `button:hover { border-color: #E6142D }`,
    `md-dialog-actions { text-align: center }`,
    `div { color: black; font-size: 16px; padding: 5px }`,
    `h1 { font-family: 'Roboto', sans-serif; text-align: center }`
  ]
})
export class ConfirmDialog {
    constructor(public dialogRef: MdDialogRef<ConfirmDialog>) { }
}