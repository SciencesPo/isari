import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

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

  constructor(
    private route: ActivatedRoute,
    private isariDataService: IsariDataService) {}

  ngOnInit() {
    this.route.params
      .subscribe(({ feature, id }) => {
        this.feature = feature;
        Promise.all([
          this.isariDataService.getPeople(+id), // @TODO dependson feature
          this.isariDataService.getLayout(this.feature)
        ]).then(([data, layout]) => {
          this.data = data;
          this.layout = layout;
        });
      });
  }

}
