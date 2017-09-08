import { TranslateService, LangChangeEvent } from 'ng2-translate';
import { IsariDataService } from './../isari-data.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/switchMap';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import keyBy from 'lodash/keyBy';
import flattenDeep from 'lodash/flattenDeep';
import uniq from 'lodash/uniq';
import { BehaviorSubject } from 'rxjs';
import { EditLogApiOptions } from './EditLogApiOptions.class';

import zipObject from 'lodash/zipObject';
import { DatePipe } from '@angular/common';
import {saveAs} from 'file-saver';
import Papa from 'papaparse';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      CSV_MIME = 'text/csv;charset=utf-8';

@Component({
  selector: 'isari-logs',
  templateUrl: './isari-logs.component.html',
  // styleUrls: ['./isari-layout.component.css']
})
export class IsariLogsComponent implements OnInit {

  feature: string;
  options: EditLogApiOptions = { skip: 0, limit: 5 };
  options$: BehaviorSubject<EditLogApiOptions>;
  details$: BehaviorSubject<boolean>;
  logs$: Observable<any[]>;
  labs$: Observable<any[]>;

  constructor(
    private route: ActivatedRoute,
    private isariDataService: IsariDataService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.options$ = new BehaviorSubject(this.options);
    this.details$ = new BehaviorSubject(false);
    this.logs$ = Observable
    .combineLatest([
      this.route.paramMap,
      this.options$,
      this.translate.onLangChange
        .map((event: LangChangeEvent) => event.lang)
        .startWith(this.translate.currentLang)
    ])
    .switchMap(([paramMap, options, lang]) => {
      this.feature = (<ParamMap>paramMap).get('feature');
      this.options = Object.assign({}, {
        itemID: (<ParamMap>paramMap).get('itemID')
      }, options);

      return this.isariDataService
      .getHistory(this.feature, this.options, lang)
      .combineLatest(this.details$)
    })
    .map(([logs, details]) => {
      this.labs$ = this.isariDataService.getForeignLabel('Organization', uniq(flattenDeep(logs.map(log => log.who.roles.map(role => role.lab)))))
        .map(labs => keyBy(labs, 'id'));

        if (details && this.options['path']) return logs.map(log => Object.assign({}, log, {
        _open: true,
        diff: log.diff.filter(diff => diff.path[0] === this.options['path'])
      }));

      return logs.map(log => Object.assign({}, log, { _open: details }));
    });
  }

  changeOpt(options) {
    this.options = options;
    this.options$.next(options);
  }

  toggleDetails() {
    this.details$.next(!this.details$.value);
  }

  downloadCSV(logs) {

    let data = [];

    if (this.details$.value) {


      const logs$ = logs.reduce((acc1, log) => [
        ...acc1,
        ...log.diff.reduce((acc2, diff) => [...acc2, (diff._beforeLabelled$ || Observable.of('')), (diff._afterLabelled$ || Observable.of(''))], [])
      ], []);

      (<Observable<any>>Observable.merge(logs$)
      .mergeAll())
      .scan((acc, value, i) => [...acc, value], [])
      .take(logs$.length)
      .last()
      .subscribe(values => {

        data = logs.reduce((d, log) => [
          ...d,
          ...log.diff.map((diff, j) => ({
            date: (new DatePipe('fr-FR')).transform(log.date, 'yyyy-MM-dd HH:mm'),
            item: log.item.name,
            action: diff.editType,
            field: diff._label,
            before: values[(d.length + j) * 2],
            after: values[(d.length + j) * 2 + 1],
            authorLabs: log.who.roles.map(role => (role.lab || '')).join('\r\n'),
            authorRoles: log.who.roles.map(role => role._label).join('\r\n'),
          }))
        ], []);

        const csvString = Papa.unparse(data);
        const blob = new Blob([csvString], {type: CSV_MIME});

        saveAs(blob, `toto.csv`);

      });

    } else {
      data = logs.map(log => ({
        date: (new DatePipe('fr-FR')).transform(log.date, 'yyyy-MM-dd HH:mm'),
        item: log.item.name,
        action: log.action,
        fields: log._labels.join('\r\n'),
        author: log.who.name,
        authorLabs: log.who.roles.map(role => (role.lab || '')).join('\r\n'),
        authorRoles: log.who.roles.map(role => role._label).join('\r\n'),
      }));

      const csvString = Papa.unparse(data);
      const blob = new Blob([csvString], {type: CSV_MIME});

      saveAs(blob, `toto.csv`);
    }


  }


}
