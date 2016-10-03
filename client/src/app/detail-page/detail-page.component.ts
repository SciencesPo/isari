import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IsariInputComponent } from '../fields/isari-input/isari-input.component';

@Component({
  selector: 'isari-detail-page',
  templateUrl: 'detail-page.component.html',
  styleUrls: ['detail-page.component.css']
})
export class DetailPageComponent implements OnInit {

  fields: Array<any>;
  feature: string;

  constructor (private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params
      .subscribe(({ feature }) => {
        this.feature = feature;
      });

    this.fields = [
      {
       name: 'firstname',
       type: IsariInputComponent,
       label: 'firstname'
      },
      {
       name: 'lastname',
       type: IsariInputComponent,
       label: 'lastname'
      }
    ];
  }

}
