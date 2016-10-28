import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'isari-data-table',
  templateUrl: 'data-table.component.html',
  styleUrls: ['data-table.component.css']
})
export class DataTableComponent implements OnInit, OnChanges {
  page: any[];
  itemsPerPage = 10;

  @Input() data: any[];
  @Input() cols: any[];

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.page = this.data.slice(0, this.itemsPerPage);
  }

  pageChanged($event) {
    this.itemsPerPage = $event.itemsPerPage;
    this.page = this.data.slice(($event.page - 1) * $event.itemsPerPage, $event.page * $event.itemsPerPage);
  }

}
