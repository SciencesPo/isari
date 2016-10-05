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
  layout: any;

  constructor (private route: ActivatedRoute, private isariDataService: IsariDataService) {}

  ngOnInit() {

    this.route.params
      .subscribe(({ feature, id }) => {
        this.feature = feature;
        Promise.all([
          this.isariDataService.getPeople(+id), // @TODO dependson feature
          this.isariDataService.getSchema(this.feature),
          this.isariDataService.getLayout(this.feature)
        ]).then(([data, schema, layout]) => {
          this.data = data;

          const extraFields: Set<any> = new Set(layout.reduce((acc, group) => {
            if (Array.isArray(group)) {
              return [...acc, ...group];
            }
            if (typeof group === 'string') {
              return [...acc, group];
            }
            return [...acc, ...group.fields];
          }, []));

          layout = [...layout, ...Array.from(
            new Set([...Object.keys(schema)].filter(x => !extraFields.has(x)))
          )];

          this.layout = layout.map(group => {
            if (Array.isArray(group)) {
              return { fields: group };
            }
            if (typeof group === 'string') {
              return { fields: [group] };
            }
            return Object.assign({}, group, {
              fields: group.fields,
              label: group.label['fr'] // @TODO get lang from somewhere
            });
          });

          this.fields = Object.keys(schema).map(key => Object.assign({}, schema[key], {
            name: key,
            label: schema[key].label['fr'], // @TODO get lang from somewhere
            fieldType: IsariInputComponent // @TODO get from type + ...
          }));

        });
      });
  }

}
