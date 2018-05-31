import { Component, Input, Output, OnInit, OnChanges, EventEmitter } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { FormControl } from '@angular/forms';
import difference from 'lodash/difference';

@Component({
  selector: 'isari-cols-selector',
  templateUrl: './isari-cols-selector.component.html',
  styleUrls: ['./isari-cols-selector.component.css']
})
export class IsariColsSelectorComponent implements OnInit, OnChanges {
  lang: string;
  colSelector: FormControl;

  @Input() cols: any[] = [];
  @Input() selectedColumns: any[] = [];
  @Output() onColSelected = new EventEmitter<any>();

  constructor(private translate: TranslateService) {
    this.colSelector = new FormControl([]);
  }

  ngOnInit() {
    this.lang = this.translate.currentLang;
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.lang = event.lang;
    });

    this.colSelector.valueChanges.subscribe(cols => {
      this.onColSelected.emit({ cols })
    });

  }

  ngOnChanges() {
    if (this.cols && this.cols.length && this.selectedColumns && this.selectedColumns.length) {
      const shouldUpdate = !!difference(
        this.selectedColumns.map(col => col.key),
        this.colSelector.value.map(col => col.key)
      ).length;
      if (shouldUpdate) {
        this.colSelector.setValue(this.cols.filter(col => !!this.selectedColumns.find(selectedCol => selectedCol.key === col.key)));
      }
    }
  }

}
