import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
    selector: 'isa-close-modal',
    template: `
  <h1 mat-dialog-title>{{ 'dialogLeave.title' | translate }}</h1>

  <mat-dialog-content>{{ 'dialogLeave.content' | translate }}</mat-dialog-content>
  
  <mat-dialog-actions>
    <button mat-button (click)="dialogRef.close(true)">{{ 'dialogLeave.leave' | translate }}</button>
    <button mat-button (click)="dialogRef.close(false)">{{ 'dialogLeave.stay' | translate }}</button>
  </mat-dialog-actions>
  `,
    styles: [
        // `mat-dialog-actions { justify-content: center; margin-bottom: 0; }`,
    ]
})
export class IsariCloseModal {
    constructor(public dialogRef: MatDialogRef<IsariCloseModal>) { }
}
