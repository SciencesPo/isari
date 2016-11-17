import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/startWith';
import { IsariDataService } from '../isari-data.service';


@Component({
  selector: 'isari-list',
  templateUrl: 'isari-list.component.html',
  styleUrls: ['isari-list.component.css']
})
export class IsariListComponent implements OnInit {

  feature: string;
  data: any[] = [];
  filteredData: any[] = [];
  cols: any[] = [];
  editedId: string = '';
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

        this.isariDataService.getColumnsWithDefault(feature)
          .then(defaultColumns => {
            this.selectedColumns = defaultColumns;
            this.loadDatas();
          });

      });

    // get activated item in editor
    let editorRoute = this.route.parent.children.find(route => route.outlet === 'editor');
    if (editorRoute) {
      editorRoute.params.subscribe(({ id }) => {
        this.editedId = id;
      });
    }
  }

  colSelected($event) {
    this.selectedColumns = $event.cols;
    this.loadDatas();
  }

  filtered($event) {
    this.filteredData = $event.data;
  }

  private loadDatas() {
    this.isariDataService.getDatas(this.feature, {
      fields: this.selectedColumns.map(col => col.key),
      applyTemplates: true
    }).then(data => {
      this.data = data;
      this.filteredData = [...data];
    });
  }

}
