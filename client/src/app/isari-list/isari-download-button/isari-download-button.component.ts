import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { TranslateService, LangChangeEvent } from 'ng2-translate';
import {saveAs} from 'file-saver';
import Papa from 'papaparse';
import { IsariDataService } from '../../isari-data.service';
import { ActivatedRoute } from '@angular/router';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      CSV_MIME = 'text/csv;charset=utf-8';

@Component({
  selector: 'isari-download-button',
  templateUrl: './isari-download-button.component.html',
  styleUrls: ['./isari-download-button.component.css']
})
export class IsariDownloadButtonComponent implements OnInit {
  lang: string;
  defaultLang: string = 'fr';
  organization: any;

  @Input() data: any[] = [];
  @Input() feature: string;
  @Input() startDate: string;
  @Input() endDate: string;
  @Input() selectedColumns: any[] = [];

  constructor(
    private elementRef: ElementRef,
    private translate: TranslateService,
    private isariDataService: IsariDataService,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.lang = this.translate.currentLang;
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.lang = event.lang;
    });
    this.route.data.subscribe(({ organization }) => {
      this.organization = organization;
    });
  }

  getHeaders() {
    const headerLine = {};

    this.selectedColumns.forEach(column => {
      headerLine[column.key] = column.label[this.lang];
    });

    return headerLine;
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

  getDataToSave() {
    const columns = this.selectedColumns;

    return this.data.map(line => {
      const output = {};

      for (let i = 0, l = columns.length; i < l; i++) {
        const column = columns[i],
              k = column.key;

        output[column.label[this.lang]] = this.cellContent(line[k]);
      }

      return output;
    });
  }

  downloadXLSX() {
    const opts = {
      bookType: 'xlsx',
      bookSST: false,
      type: 'binary'
    };

    const workbook = {
      Sheets: {Sheet1: null},
      SheetNames: ['Sheet1']
    };

    const sheet = {},
          range = {s: {c: Infinity, r: Infinity}, e: {c: -Infinity, r: -Infinity}};

    const data = [this.getHeaders()].concat(this.getDataToSave());

    for (let R = 0, l = data.length; R < l; R++) {
      const line = data[R];
      let C = 0;

      for (const k in line) {

        // Updating range
        if (range.s.r > R) {
          range.s.r = R;
        }
        if (range.s.c > C) {
          range.s.c = C;
        }
        if (range.e.r < R) {
          range.e.r = R;
        }
        if (range.e.c < C) {
          range.e.c = C;
        }

        const value = line[k],
              address = XLSX.utils.encode_cell({c: C, r: R}),
              cell = {v: value};

        sheet[address] = cell;

        C++;
      }
    }

    sheet['!ref'] = XLSX.utils.encode_range(range);

    workbook.Sheets.Sheet1 = sheet;

    const xlsx = XLSX.write(workbook, opts);

    // Creating a buffer for the Blob
    const buffer = new ArrayBuffer(xlsx.length),
          view = new Uint8Array(buffer);

    for (let i = 0, l = xlsx.length; i !== l; i++) {
      view[i] = xlsx.charCodeAt(i) & 0xFF;
    }

    const blob = new Blob([buffer], {type: XLSX_MIME});

    saveAs(blob, `${this.feature}.xlsx`);
  }

  downloadCSV() {
    const csvString = Papa.unparse(this.getDataToSave()),
          blob = new Blob([csvString], {type: CSV_MIME});

    saveAs(blob, `${this.feature}.csv`);
  }

   getExportDowloadLink(route) {
    if (!this.organization) {
      return null;
    }
  
    return this.isariDataService.createExportDownloadLink(
      'xlsx',
      route,
      {id: this.organization.id,
        start: this.startDate,
        end: this.endDate}
    );
  }
}
