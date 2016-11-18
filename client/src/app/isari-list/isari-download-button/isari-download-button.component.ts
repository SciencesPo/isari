import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { TranslateService, LangChangeEvent } from 'ng2-translate';
import {saveAs} from 'file-saver';
import Papa from 'papaparse';

@Component({
  selector: 'isari-download-button',
  templateUrl: './isari-download-button.component.html',
  styleUrls: ['./isari-download-button.component.css']
})
export class IsariDownloadButtonComponent implements OnInit {
  lang: string;

  @Input() data: any[] = [];
  @Input() feature: string;
  @Input() selectedColumns: any[] = [];

  constructor(private elementRef: ElementRef, private translate: TranslateService) { }

  ngOnInit() {
    this.lang = this.translate.currentLang;
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.lang = event.lang;
    });
  }

  getDataToSave() {
    const columns = new Set(this.selectedColumns.map(column => column.key)),
          labels = {};

    this.selectedColumns.forEach(column => (labels[column.key] = column.label[this.lang]));

    return this.data.map(line => {
      const output = {};

      for (const k in line) {
        if (columns.has(k)) {
          output[labels[k]] = Array.isArray(line[k]) ? line[k].join(',') : line[k];
        }
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

    const sheet = XLSX.write(this.data, opts);
    console.log(sheet);

    // let buffer = new ArrayBuffer(sheet.length);
  }

  downloadODS() {
    console.log('Not Implemented!');
  }

  downloadCSV() {
    const csvString = Papa.unparse(this.getDataToSave()),
          blob = new Blob([csvString], {type: 'text/csv;charset=utf-8'});

    saveAs(blob, `${this.feature}.csv`);
  }
}
