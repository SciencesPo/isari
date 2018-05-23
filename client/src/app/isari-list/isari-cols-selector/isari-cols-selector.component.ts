import { Component, Input, Output, OnInit, OnChanges, EventEmitter } from '@angular/core';
import { TranslateService, LangChangeEvent } from 'ng2-translate';
import 'rxjs/add/operator/skip';
import { FormControl } from '@angular/forms';


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
    this.colSelector = new FormControl();
  }

  ngOnInit() {
    this.lang = this.translate.currentLang;
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.lang = event.lang;
    });

    this.colSelector.valueChanges.skip(1).subscribe(cols => {
      this.onColSelected.emit({ cols })
    });
  }

  ngOnChanges() {
    if (this.cols && this.cols.length && this.selectedColumns && this.selectedColumns.length) {
      this.colSelector.setValue(this.cols.filter(col => !!this.selectedColumns.find(selectedCol => selectedCol.key === col.key)));
    }
  }

}
