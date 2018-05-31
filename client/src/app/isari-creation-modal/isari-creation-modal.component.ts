import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Observable, combineLatest } from 'rxjs';
import { FormControl } from '@angular/forms';
import { TranslateService, LangChangeEvent } from 'ng2-translate';
import { IsariDataService } from '../isari-data.service';
import { map, startWith } from 'rxjs/operators';

@Component({
    selector: 'isari-creation-modal',
    templateUrl: './isari-creation-modal.component.html',
    styles: [
    ]
})
export class IsariCreationModal implements OnInit {

    public feature: string;
    public label = 'Rechercher ...';
    public queryControl: FormControl;
    public api: string;
    public minimalSearchDone = false;
    public items: any[];
    private lang: string;

    constructor(
        public dialogRef: MatDialogRef<IsariCreationModal>,
        private isariDataService: IsariDataService,
        private translate: TranslateService
    ) { }

    ngOnInit() {
        this.feature = this.dialogRef.componentInstance.feature;
        this.queryControl = new FormControl();
        const src = this.isariDataService.srcForeignBuilder(this.feature);
        combineLatest(
            src(this.queryControl.valueChanges, 20),
            this.translate.onLangChange.pipe(
                map((event: LangChangeEvent) => event.lang),
                startWith(this.translate.currentLang)
            )
        ).subscribe(([{ values }, lang]: [{ values: any[] }, string]) => {
            this.lang = lang;
            if (this.queryControl.value) {
                this.minimalSearchDone = true;
                this.items = values.map(this.translateItem.bind(this));
            } else {
                this.items = [];
            }
        });
    }

    closeMe() {
        this.dialogRef.close();
    }

    private translateItem(item) {
        let label = item.value;
        if (item.label && item.label[this.lang]) {
            label = item.label[this.lang];
        } else if (item.label && item.label['fr']) {
            label = item.label['fr'];
        }
        return Object.assign({}, item, { label });
    }

}
