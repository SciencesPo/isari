import { TranslateService, LangChangeEvent } from 'ng2-translate';
import { IsariDataService } from './../isari-data.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/switchMap';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import omit from 'lodash/omit';
import keyBy from 'lodash/keyBy';
import flattenDeep from 'lodash/flattenDeep';
import uniq from 'lodash/uniq';
import { BehaviorSubject } from 'rxjs';
import { EditLogApiOptions } from './EditLogApiOptions.class';

@Component({
  selector: 'isari-logs',
  templateUrl: './isari-logs.component.html',
  // styleUrls: ['./isari-layout.component.css']
})
export class IsariLogsComponent implements OnInit {

  feature: string;
  options: EditLogApiOptions = { skip: 0, limit: 5 };
  logs$: Observable<any[]>;
  labs$: Observable<any[]>;
  options$: BehaviorSubject<EditLogApiOptions>

  constructor(
    private route: ActivatedRoute,
    private isariDataService: IsariDataService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.options$ = new BehaviorSubject(this.options);
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
    })
    .map(logs => {
      console.log(logs);
      this.labs$ = this.isariDataService.getForeignLabel('Organization', uniq(flattenDeep(logs.map(log => log.who.roles.map(role => role.lab)))))
        .map(labs => keyBy(labs, 'id'));
      return logs;
    });
  }

  changeOpt(options) {
    this.options = options;
    this.options$.next(options);
  }

}
