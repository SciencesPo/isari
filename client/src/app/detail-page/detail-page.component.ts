import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup } from '@angular/forms';

import { IsariDataService } from '../isari-data.service';

@Component({
  selector: 'isari-detail-page',
  templateUrl: 'detail-page.component.html',
  styleUrls: ['detail-page.component.css']
})
export class DetailPageComponent implements OnInit {

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
          this.layout = layout;
          this.form = this.isariDataService.buildForm(this.layout, this.data);
        });
      });
  }

  save($event) {
    if (!this.form.disabled && this.form.valid && this.form.dirty) {
      console.log('save', this.form.value);
      this.data = this.form.value;
      return;
    }
    if (!this.form.valid) {
      console.log('ERROR', this.form);
    }
  }

}
