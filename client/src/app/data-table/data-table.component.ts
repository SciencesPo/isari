import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'isari-data-table',
  templateUrl: 'data-table.component.html',
  styleUrls: ['data-table.component.css']
})
export class DataTableComponent implements OnInit, OnChanges {
  page: any[];
  itemsPerPage = 10;
  sortedState: { key: string, reverse: boolean } = { key: '', reverse: false };

  @Input() data: any[];
  @Input() cols: any[];

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.calculPage(1);
  }

  pageChanged($event) {
    this.itemsPerPage = $event.itemsPerPage;
    this.calculPage($event.page);
  }

  sortBy(col, $event) {
    $event.preventDefault();
    this.data.sort(this.dynamicSort(col.key, this.sortedState.key === col.key && !this.sortedState.reverse));
    this.sortedState.reverse = (this.sortedState.key === col.key) ? !this.sortedState.reverse : false;
    this.sortedState.key = col.key;
    this.calculPage(1);
  }

  private calculPage(page: number) {
    this.page = this.data.slice((page - 1) * this.itemsPerPage, page * this.itemsPerPage);
  }

  private dynamicSort(property, reverse) {
    let sortOrder = reverse ? -1 : 1;
    return function (a, b) {
        let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    };
}

}
