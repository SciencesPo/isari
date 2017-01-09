import { Component, Input, Output, OnInit, OnChanges, SimpleChanges, Inject, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/platform-browser';
import { TranslateService, LangChangeEvent } from 'ng2-translate';

import { PageScrollService, PageScrollInstance, PageScrollConfig } from 'ng2-page-scroll';

@Component({
  selector: 'isari-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent implements OnInit, OnChanges {
  page: any[];
  itemsPerPage = 10;
  sortedState: { key: string, reverse: boolean } = { key: '', reverse: false };
  unfilteredData: any[];
  lang: string;
  defaultLang: string = 'fr';

  @Input() loading: boolean = false;
  @Input() data: any[];
  @Input() cols: any[];
  @Input() editedId: string;
  @Output() onFilter = new EventEmitter<any>();

  constructor(
    private router: Router,
    private pageScrollService: PageScrollService,
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: any) {
    PageScrollConfig.defaultScrollOffset = 50;
    PageScrollConfig.defaultDuration = 500;
  }

  ngOnInit() {
    this.lang = this.translate.currentLang;
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.lang = event.lang;
    });
  }

  cellContent (data): string {
    if (data === null || data === undefined) {
      return ''
    } else if (data instanceof Array) {
      return data.map(v => this.cellContent(v)).join(', ')
    } else if (data.label) {
      return data.label[this.lang] || data.label[this.defaultLang] || ''
    } else {
      return String(data)
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    let navigateToFirstPage = false;
    if (changes['cols'] && this.cols && this.cols.length) {
      // @TODO : destroy old filters ?
      this.cols = this.cols.map(col => {
        let filterControl = new FormControl('');
        filterControl.valueChanges.subscribe(value => {
          this.applyFilter(col.key, value);
        });
        return Object.assign({}, col, { filterControl });
      });
      navigateToFirstPage = true;
    }
    if (changes['data'] && this.data && this.data.length) {
      this.unfilteredData = this.data;
      navigateToFirstPage = true;
    }
    if (navigateToFirstPage) {
      this.calculPage(1);
    }
  }

  pageChanged($event) {
    this.itemsPerPage = $event.itemsPerPage;
    this.calculPage($event.page);
  }

  sortBy(col) {
    // $event.preventDefault();
    this.data.sort(this.dynamicSort(col.key, this.sortedState.key === col.key && !this.sortedState.reverse));
    this.sortedState.reverse = (this.sortedState.key === col.key) ? !this.sortedState.reverse : false;
    this.sortedState.key = col.key;
    this.calculPage(1);
  }

  edit(id) {
    // highlight row
    this.editedId = id;

    // scroll to form
    setTimeout(() => {
      let pageScrollInstance: PageScrollInstance = PageScrollInstance.simpleInstance(this.document, '#form');
      this.pageScrollService.start(pageScrollInstance);
    })

  // je ne sais pas pquoi ça marche pas
  //   this.router.navigate([{ outlets: { editor: [ id ] } }]);
  }

  private applyFilter(key: string, value: string) {

    // TODO: this is temporary because enum labels are nested objects!
    // TODO: this probably does not work with multi-filter!

    this.data = this.unfilteredData
      .filter(item => {
        let target;

        if (Array.isArray(item[key])) {
          target = item[key].join(' ');
        }
        else if (typeof item[key] === 'object') {
          target = item[key].label[this.lang];
        }
        else {
          target = item[key];
        }

        return String(target).toLowerCase().indexOf(value.toLowerCase()) !== -1;
      });
    this.calculPage(1);
    this.onFilter.emit({ data: this.data });
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
