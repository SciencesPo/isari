import { Component, Input, Output, OnInit, OnChanges, SimpleChanges, Inject, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService, LangChangeEvent } from 'ng2-translate';
import deburr from 'lodash/deburr';
import { StorageService } from '../storage.service';

@Component({
  selector: 'isari-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnInit, OnChanges {
  page: any[];
  filters: any = {};
  sortedState: { key: string, reverse: boolean } = { key: '', reverse: false };
  unfilteredData: any[];
  lang: string;
  defaultLang: string = 'fr';

  @Input() data: any[];
  @Input() cols: any[];
  @Input() editedId: string;
  @Output() onFilter = new EventEmitter<any>();
  @Output() onItemsPerPageChange = new EventEmitter<number>();
  @Input() itemsPerPage: number = 10;
  @Input() feature: string;

  constructor(
    private storageService: StorageService,
    private router: Router,
    private translate: TranslateService) {}

  ngOnInit() {
    this.lang = this.translate.currentLang;
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.lang = event.lang;
    });
  }

  cellContent (data): string {
    if (data === null || data === undefined) {
      return '';
    } else if (data instanceof Array) {
      return data.map(v => this.cellContent(v)).join(', ');
    } else if (data.label) {
      return data.label[this.lang] || data.label[this.defaultLang] || '';
    } else {
      return String(data);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    let navigateToFirstPage = false;
    if (changes['cols'] && this.cols && this.cols.length) {

      // Resetting filters
      this.filters = this.storageService.get('filters', this.feature) || {};

      this.cols = this.cols.map(col => {
        let filterControl = new FormControl(this.filters[col.key] || '');
        filterControl.valueChanges.subscribe(value => {
          this.applyFilter(col.key, value);
          this.storageService.save(this.filters, 'filters', this.feature);
        });
        return Object.assign({}, col, { filterControl });
      });
      navigateToFirstPage = true;
    }
    if (changes['data'] && this.data && this.data.length) {
      this.unfilteredData = this.data;
      navigateToFirstPage = true;

      if (this.cols.length) {
        this.sortedState = this.storageService.get('sort', this.feature) || { key: this.cols[0].key, reverse: false };
        this.applySort();
      }
      this.filterData();

      // NOTE: this is a duct tape kind of setTimeout
      setTimeout(() => {
        this.onFilter.emit({ data: this.data });
      }, 0);
    }
    if (navigateToFirstPage) {
      this.calculPage(1);
    }
  }

  pageChanged($event) {
    if (this.itemsPerPage !== $event.itemsPerPage) this.onItemsPerPageChange.emit($event.itemsPerPage);
    this.itemsPerPage = $event.itemsPerPage;
    this.calculPage($event.page);
  }

  sortBy(col) {
    if (this.sortedState.key !== col.key) {
      this.sortedState.key = col.key;
      this.sortedState.reverse = false;
    }
    else {
      this.sortedState.reverse = !this.sortedState.reverse;
    }
    this.storageService.save(this.sortedState, 'sort', this.feature);
    this.applySort();
  }

  private applySort() {
    this.data.sort(this.dynamicSort(this.sortedState.key, this.sortedState.reverse));
    this.calculPage(1);
  }

  edit(id) {
    // highlight row
    this.editedId = id;
  }

  // NOTE: ce genre de truc est utilisé un peu partout. Possibilité de refacto!
  private getValueForKey(item, key): string {
    if (Array.isArray(item[key])) {
      return item[key].map(e => {
        if (typeof e === 'object')
          return e.label[this.lang] || e.label[this.defaultLang];
        return e;
      }).join(' ');
    }
    else if (typeof item[key] === 'object') {
      return item[key].label[this.lang] || item[key].label[this.defaultLang];
    }
    else {
      return item[key] || '';
    }
  }

  private compare(key, query, item) {
    let target = this.getValueForKey(item, key);

    const a = deburr(String(target).toLowerCase());
    const b = deburr(query.toLowerCase());

    return a.indexOf(b) !== -1;
  }

  private applyFilter(key: string, query: string) {

    // Updating the filters
    if (!query) {
      delete this.filters[key];
    }
    else {
      this.filters[key] = query;
    }

    this.filterData();
    this.onFilter.emit({ data: this.data });
  }

  private filterData() {
    const filters = Object.keys(this.filters);
    this.data = this.unfilteredData
      .filter(item => {
        return filters.every(f => {
          return this.compare(f, this.filters[f], item);
        });
      });
    this.calculPage(1);
  }

  private calculPage(page: number) {
    if (this.data.length === 0) return;
    this.page = this.data.slice((page - 1) * this.itemsPerPage, page * this.itemsPerPage);
  }

  private dynamicSort(property, reverse) {
    let sortOrder = reverse ? -1 : 1;
    return (a, b) => {
      const valueA = this.getValueForKey(a, property).toLowerCase(),
            valueB = this.getValueForKey(b, property).toLowerCase();

      let result = (valueA < valueB) ? -1 : (valueA > valueB) ? 1 : 0;

      return result * sortOrder;
    };
  }

}
