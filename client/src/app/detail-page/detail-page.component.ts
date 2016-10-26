import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup } from '@angular/forms';

import { IsariDataService } from '../isari-data.service';

@Component({
  selector: 'isari-detail-page',
  templateUrl: 'detail-page.component.html',
  styleUrls: ['detail-page.component.css']
})
export class DetailPageComponent implements OnInit, OnChanges {

  feature: string;
  data: any;
  layout: any;
  form: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private isariDataService: IsariDataService) {}

  ngOnInit() {
    this.route.params
      .subscribe(({ feature, id }) => {
        this.feature = feature;
        Promise.all([
          this.isariDataService.getData(this.feature, id),
          this.isariDataService.getLayout(this.feature)
        ]).then(([data, layout]) => {
          this.data = data;

          if (!this.data.opts) {
            this.data.opts = {
              writable: true
            };
          }

          this.layout = this.isariDataService.translate(layout, 'en');
          this.form = this.isariDataService.buildForm(this.layout, this.data);
          // disabled all form
          if (this.data.opts.editable === false) {
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
    if (!this.form.disabled && this.form.valid) {
       // check for change
      console.log('save', this.form.value);
      this.data = this.form.value;
      return;
    }
    if (!this.form.valid) {
      console.log('ERROR', this.form);
    }
  }

}
