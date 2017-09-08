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

    function csv(data) {
      const csvString = Papa.unparse(data);
      const blob = new Blob([csvString], {type: CSV_MIME});
      saveAs(blob, `toto.csv`);
    }

    const translations$ = this.translate.get([
      'editLogs.date', 'editLogs.who', 'editLogs.action',
      'editLogs.fields', 'editLogs.role', 'editLogs.lab',
      'editLogs.object.' + this.feature, 'editLogs.before', 'editLogs.after'
    ]);

    if (this.details$.value) {
      // Je suis navré pour ce qui va suivre

      const logs$ = logs.reduce((acc1, log) => [
        ...acc1,
        ...log.diff.reduce((acc2, diff) => [...acc2, (diff._beforeLabelled$ || Observable.of('')), (diff._afterLabelled$ || Observable.of(''))], [])
      ], []);

      // RxJS FTW ?!
      (<Observable<any>>Observable.merge(logs$)
      .mergeAll())
      .scan((acc, value, i) => [...acc, value], [])
      .take(logs$.length)
      .last()
      .combineLatest(translations$)
      .subscribe(([values, translations]) => {
        csv(logs.reduce((d, log) => [
          ...d,
          ...log.diff.map((diff, j) => ({
            [translations['editLogs.date']]: (new DatePipe('fr-FR')).transform(log.date, 'yyyy-MM-dd HH:mm'),
            [translations['editLogs.object.' + this.feature]]: log.item.name,
            [translations['editLogs.action']]: diff.editType,
            [translations['editLogs.fields']]: diff._label,
            [translations['editLogs.before']]: values[(d.length + j) * 2],
            [translations['editLogs.after']]: values[(d.length + j) * 2 + 1],
            [translations['editLogs.who']]: log.who.name,
            [translations['editLogs.lab']]: log.who.roles.map(role => (role.lab || '')).join('\r\n'),
            [translations['editLogs.role']]: log.who.roles.map(role => role._label).join('\r\n'),
          }))
        ], []));
      });

    } else {
      translations$.subscribe(translations => {
        csv(logs.map(log => ({
          [translations['editLogs.date']]: (new DatePipe('fr-FR')).transform(log.date, 'yyyy-MM-dd HH:mm'),
          [translations['editLogs.object.' + this.feature]]: log.item.name,
          [translations['editLogs.action']]: log.action,
          [translations['editLogs.fields']]: log._labels.join('\r\n'),
          [translations['editLogs.who']]: log.who.name,
          [translations['editLogs.lab']]: log.who.roles.map(role => (role.lab || '')).join('\r\n'),
          [translations['editLogs.role']]: log.who.roles.map(role => role._label).join('\r\n'),
        })));
      })
    }


  }


}
