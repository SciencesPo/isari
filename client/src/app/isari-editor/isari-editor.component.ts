import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { TranslateService, LangChangeEvent } from 'ng2-translate';

// import { MdSnackBar, MdSnackBarConfig } from '@angular/material';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/startWith';

import { IsariDataService } from '../isari-data.service';

@Component({
  selector: 'isari-editor',
  templateUrl: 'isari-editor.component.html',
  styleUrls: ['isari-editor.component.css'],
  // providers: [MdSnackBar]
})
export class IsariEditorComponent implements OnInit {

  id: number;
  feature: string;
  data: any;
  layout: any;
  form: FormGroup;
  // mdSnackBarConfig: MdSnackBarConfig;
  organization: string | undefined;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private isariDataService: IsariDataService,
    private translate: TranslateService,
    // private snackBar: MdSnackBar,
    private viewContainerRef: ViewContainerRef) {}

  ngOnInit() {
    // this.mdSnackBarConfig = new MdSnackBarConfig(this.viewContainerRef);

    let $routeParams = this.route.parent
      ? Observable
        .combineLatest(this.route.parent.params, this.route.parent.data, this.route.params, this.route.data)
        .map(([a, b, c, d]) => Object.assign({}, a, b, c, d))
      : this.route.params;

    Observable.combineLatest(
      $routeParams,
      this.translate.onLangChange
        .map((event: LangChangeEvent) => event.lang)
        .startWith(this.translate.currentLang)
    ).subscribe(([{ feature, id, organization }, lang]) => {
        this.organization = organization.id;
        this.feature = feature;
        this.id = id;
        Promise.all([
          this.isariDataService.getData(this.feature, id, this.organization),
          this.isariDataService.getLayout(this.feature)
        ]).then(([data, layout]) => {
          this.data = data;
          this.layout = this.isariDataService.translate(layout, lang);
          this.layout = this.isariDataService.closeAll(this.layout);
          this.form = this.isariDataService.buildForm(this.layout, this.data);
          // disabled all form
          if (this.data.opts && this.data.opts.editable === false) {
            this.form.disable();
          }
        });
      });
  }

  save($event) {
    if (!this.form.disabled && this.form.valid && this.form.dirty) {
      this.isariDataService.save(
        this.feature,
        Object.assign({}, this.form.value, { id: this.id }),
        this.organization
      ).then(data => {
          if (this.id !== data.id) {
            this.router.navigate([this.feature, data.id]);
          }
          // this.snackBar.open('Saved', null, this.mdSnackBarConfig);
        });
    }
    if (!this.form.valid) {
      console.error('ERROR');
      // this.snackBar.open('It didn\'t quite work!', 'Try Again', this.mdSnackBarConfig);
    }
  }

}
