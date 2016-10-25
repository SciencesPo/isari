import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'isari-data-table',
  templateUrl: 'data-table.component.html',
  styleUrls: ['data-table.component.css']
})
export class DataTableComponent implements OnInit {
  page: any[];

  @Input() data: any[];
  @Input() cols: any[];

  constructor() { }

  ngOnInit() {
  }

  pageChanged($event) {
    this.page = this.data.slice(($event.page - 1) * $event.itemPerPage, $event.page * $event.itemPerPage);
  }

}
