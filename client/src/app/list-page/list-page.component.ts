import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IsariDataService } from '../isari-data.service';


@Component({
  selector: 'isari-list-page',
  templateUrl: 'list-page.component.html',
  styleUrls: ['list-page.component.css']
})
export class ListPageComponent implements OnInit {

  feature: string;
  data: any[] = [];
  cols: any[] = [];
  selectedColumns: any[] = [];

  constructor (private route: ActivatedRoute, private isariDataService: IsariDataService) {}

  ngOnInit() {
    this.route.params
      .subscribe(({ feature }) => {
        this.feature = feature;
        this.isariDataService.getColumns(feature)
          .then(columns => {
            this.cols = columns;
          });

        // @TODO : default cols
        // this.isariDataService.getDatas(feature)
        //   .then(data => {
        //     this.data = data;
        //   });
      });
  }

  colSelected($event) {
    this.selectedColumns = $event.cols;
    this.isariDataService.getDatas(this.feature, {
      fields: this.selectedColumns.map(col => col.key),
      applyTemplates: true
    }).then(data => {
      this.data = data;
    });
  }

}
