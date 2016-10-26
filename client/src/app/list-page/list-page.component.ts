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
  data: any[];
  cols: any[];
  selectedColumns: any[];

  constructor (private route: ActivatedRoute, private isariDataService: IsariDataService) {}

  ngOnInit() {
    this.route.params
      .subscribe(({ feature }) => {
        this.isariDataService.getColumns(feature)
          .then(columns => {
            this.cols = columns;
          });
      });

    this.data = [
      { id: 1, name: 'Jean', age: 42 },
      { id: 2, name: 'Kevin', age: 25 },
      { id: 3, name: 'Robert', age: 101 },
      { id: 4, name: 'Jeanne', age: 66 },
      { id: 5, name: 'Guy', age: 45 },
      { id: 6, name: 'Lilian', age: 31 },
      { id: 7, name: 'Etienne', age: 88 },
      { id: 8, name: 'Richard', age: 12 },
      { id: 9, name: 'Mouloud', age: 77 },
      { id: 10, name: 'Nicolas', age: 23 },
      { id: 11, name: 'René', age: 55 },
      { id: 12, name: 'Jean', age: 42 },
      { id: 13, name: 'Kevin', age: 25 },
      { id: 14, name: 'Robert', age: 101 },
      { id: 15, name: 'Jeanne', age: 66 },
      { id: 16, name: 'Guy', age: 45 },
      { id: 17, name: 'Lilian', age: 31 },
      { id: 18, name: 'Etienne', age: 88 },
      { id: 19, name: 'Richard', age: 12 },
      { id: 20, name: 'Mouloud', age: 77 },
      { id: 21, name: 'Nicolas', age: 23 },
      { id: 22, name: 'René', age: 55 },
      { id: 23, name: 'Jean', age: 42 },
      { id: 24, name: 'Kevin', age: 25 },
      { id: 25, name: 'Robert', age: 101 },
      { id: 26, name: 'Jeanne', age: 66 },
      { id: 27, name: 'Guy', age: 45 },
      { id: 28, name: 'Lilian', age: 31 },
      { id: 29, name: 'Etienne', age: 88 },
      { id: 30, name: 'Richard', age: 12 },
      { id: 31, name: 'Mouloud', age: 77 },
      { id: 32, name: 'Nicolas', age: 23 },
      { id: 33, name: 'René', age: 55 }
    ];

    this.selectedColumns = [
      { key: 'name', label: {fr: 'Nom'} },
      { key: 'age', label: {fr: 'Age'} }
    ];

  }

  colSelected($event) {
    this.selectedColumns = $event.cols;
  }

}
