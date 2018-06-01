import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { MAT_DIALOG_DATA } from '@angular/material';
import { IsariDataService } from '../isari-data.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

import applyTemplates from '../../../../specs/templates.models.js';

function getRequiredFields(layout: any): Array<any> {
    return layout.reduce(
        (acc, item) => {
            if (Array.isArray(item)) return [...acc, ...item.map(i => getRequiredFields(i))];
            if (item.fields) return [...acc, ...getRequiredFields(item.fields)];
            return item.requirement === "mandatory" ? [...acc, item] : acc;
        },
        []
    );
}

@Component({
    selector: 'isa-fast-creation-modal',
    templateUrl: './creation.component.html'
})
export class IsariFastCreationModal implements OnInit {
    constructor(
        public dialogRef: MatDialogRef<IsariFastCreationModal>,
        private isariDataService: IsariDataService,
        private translate: TranslateService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    lang$: Observable<string>;
    title: string;
    form: FormGroup = new FormGroup({});
    fields$: Promise<Array<any>>;
    feature: string;

    ngOnInit() {
        this.lang$ = this.translate.onLangChange.pipe(
            map((event: LangChangeEvent) => event.lang),
            startWith(this.translate.currentLang),
        );

        this.feature = this.isariDataService.getSchemaApi(this.data.feature);
        this.title = `btn_add_${this.feature}`;

        this.fields$ = this.isariDataService.getLayout(this.feature)
            .then(layout => {
                const fields = getRequiredFields(layout);
                fields.forEach(field => {
                    this.form.addControl(field.name, new FormControl('', Validators.required));
                });
                if (this.form.controls['name'] && this.data.name) {
                    this.form.controls['name'].setValue(this.data.name);
                }
                return fields;
            });
    }

    save() {
        if (this.form.invalid) return;
        this.isariDataService.save(this.feature, this.form.value)
            .then(item => this.dialogRef.close({
                ...item,
                label: applyTemplates[this.data.feature](item)
            }));
    }

}
