import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IsariInputComponent } from '../fields/isari-input/isari-input.component';
import { IsariDataService } from '../isari-data.service';

@Component({
  selector: 'isari-detail-page',
  templateUrl: 'detail-page.component.html',
  styleUrls: ['detail-page.component.css']
})
export class DetailPageComponent implements OnInit {

  feature: string;
  fields: Array<any> = [];
  data: any;

  constructor (private route: ActivatedRoute, private isariDataService: IsariDataService) {}

  ngOnInit() {
    this.route.params
      .subscribe(({ feature, id }) => {
        this.feature = feature;

        this.isariDataService.getSchema(this.feature)
          .then(schema => {
            this.fields = Object.keys(schema).map(key => Object.assign({}, schema[key], {
              name: key,
              label: schema[key].label['fr'], // @TODO get lang from somewhere
              fieldType: IsariInputComponent // @TODO get from type + ...
            }));
          });

        this.isariDataService.getPeople(+id)
          .then(people => {
            this.data = people;
          });

      });
  }

}
