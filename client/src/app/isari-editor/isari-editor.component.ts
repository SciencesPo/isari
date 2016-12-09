import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { TranslateService, LangChangeEvent } from 'ng2-translate';
import { ToasterService } from 'angular2-toaster/angular2-toaster';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/startWith';
import { IsariDataService } from '../isari-data.service';
import { UserService } from '../user.service';

@Component({
  selector: 'isari-editor',
  templateUrl: 'isari-editor.component.html',
  styleUrls: ['isari-editor.component.css']
})
export class IsariEditorComponent implements OnInit {

  id: number;
  feature: string;
  data: any;
  layout: any;
  form: FormGroup;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private isariDataService: IsariDataService,
    private userService: UserService,
    private translate: TranslateService,
    private toasterService: ToasterService,
    private viewContainerRef: ViewContainerRef) {}

  ngOnInit() {
    let $routeParams = this.route.parent
      ? Observable
        .combineLatest(this.route.parent.params, this.route.params)
        .map(([x, y]) => Object.assign({}, x, y))
      : this.route.params;

    Observable.combineLatest(
      $routeParams,
      this.userService.getRestrictedFields(),
      this.translate.onLangChange
        .map((event: LangChangeEvent) => event.lang)
        .startWith(this.translate.currentLang)
    ).subscribe(([{ feature, id }, restrictedFields, lang]) => {
      this.feature = feature;
      this.id = id;
      Promise.all([
        this.isariDataService.getData(this.feature, id),
        this.isariDataService.getLayout(this.feature)
      ]).then(([data, layout]) => {
        this.data = data;
        this.data.opts = Object.assign({ editable: true }, this.data.opts || {}, {
          restrictedFields: restrictedFields[feature],
          path: []
        });

        layout = this.isariDataService.translate(layout, lang);
        layout = this.isariDataService.closeAll(layout);
        this.form = this.isariDataService.buildForm(layout, this.data);
        this.layout = this.isariDataService.rows(layout);

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
        Object.assign({}, this.form.value, { id: this.id })
      ).then(data => {
          if (this.id !== data.id) {
            this.router.navigate([this.feature, data.id]);
          }
          this.toasterService.pop('success', 'Save', 'Success');
        })
        .catch(err => {
          this.toasterService.pop('error', 'Save', 'Error');
        });
    }
    if (!this.form.valid) {
      // let errors = this.isariDataService.getErrorsFromControls(this.form.controls);
      // console.log(errors);
      this.toasterService.pop('error', 'Save', 'Save error');
    }
  }

}
