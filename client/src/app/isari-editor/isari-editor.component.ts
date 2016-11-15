import { Component, OnInit, OnChanges, SimpleChanges, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
// import { MdSnackBar, MdSnackBarConfig } from '@angular/material';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';

import { IsariDataService } from '../isari-data.service';

@Component({
  selector: 'isari-editor',
  templateUrl: 'isari-editor.component.html',
  styleUrls: ['isari-editor.component.css'],
  // providers: [MdSnackBar]
})
export class IsariEditorComponent implements OnInit, OnChanges {

  id: number;
  feature: string;
  data: any;
  layout: any;
  form: FormGroup;
  // mdSnackBarConfig: MdSnackBarConfig;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private isariDataService: IsariDataService,
    // private snackBar: MdSnackBar,
    private viewContainerRef: ViewContainerRef) {}

  ngOnInit() {
    // this.mdSnackBarConfig = new MdSnackBarConfig(this.viewContainerRef);

    let $routeParams = this.route.parent
      ? Observable
        .combineLatest(this.route.parent.params, this.route.params)
        .map(([x, y]) => Object.assign({}, x, y))
      : this.route.params;

    $routeParams
      .subscribe(({ feature, id }) => {
        this.feature = feature;
        this.id = id;
        Promise.all([
          this.isariDataService.getData(this.feature, id),
          this.isariDataService.getLayout(this.feature)
        ]).then(([data, layout]) => {
          this.data = data;
          this.layout = this.isariDataService.translate(layout, 'en');
          this.form = this.isariDataService.buildForm(this.layout, this.data);
          // disabled all form
          if (this.data.opts && this.data.opts.editable === false) {
            this.form.disable();
          }
        });
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['lang']) {
      console.log(changes['lang']);
    }
  }

  save($event) {
    if (!this.form.disabled && this.form.valid && this.form.dirty) {
      this.isariDataService.save(this.feature, Object.assign({}, this.form.value, { id: this.id }))
        .then(data => {
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
