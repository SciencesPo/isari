import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'confirm-dialog',
  template: `
  <h1 mat-dialog-title>Confirmer la suppression ?</h1>

  <mat-dialog-actions>
    <button (click)="dialogRef.close(true)">
    	<div>Oui</div>
    </button>
    <button mat-dialog-close>
    	<div>Annuler</div>
    </button>
  </mat-dialog-actions>
  `,
  styles: [
    `button { outline:none; margin: 0px 30px 0px 30px; border-radius:10%; background-color: white; cursor:pointer }`,
    `button:hover { border-color: #E6142D }`,
    `mat-dialog-actions { text-align: center }`,
    `div { color: black; font-size: 16px; padding: 5px }`,
    `h1 { font-family: 'Roboto', sans-serif; text-align: center }`
  ]
})
export class ConfirmDialog {
  constructor(public dialogRef: MatDialogRef<ConfirmDialog>) { }
}