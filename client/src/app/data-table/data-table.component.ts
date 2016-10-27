import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'isari-data-table',
  templateUrl: 'data-table.component.html',
  styleUrls: ['data-table.component.css']
})
export class DataTableComponent implements OnInit, OnChanges {
  page: any[];

  @Input() data: any[];
  @Input() cols: any[];

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.page = this.data.slice(0, 5);
  }

  pageChanged($event) {
    this.page = this.data.slice(($event.page - 1) * $event.itemPerPage, $event.page * $event.itemPerPage);
  }

}
