import { TranslateService, LangChangeEvent } from 'ng2-translate';
import { IsariDataService } from './../isari-data.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/switchMap';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import omit from 'lodash/omit';
import keyBy from 'lodash/keyBy';
import flattenDeep from 'lodash/flattenDeep';
import uniq from 'lodash/uniq';

@Component({
  selector: 'isari-logs',
  templateUrl: './isari-logs.component.html',
  // styleUrls: ['./isari-layout.component.css']
})
export class IsariLogsComponent implements OnInit {

  feature: string;
  options: { id: string };
  logs$: Observable<any[]>;
  labs$: Observable<any[]>;

  constructor(
    private route: ActivatedRoute,
    private isariDataService: IsariDataService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.logs$ = Observable
      .combineLatest([
        this.route.params,
        this.route.queryParams,
        this.translate.onLangChange
          .map((event: LangChangeEvent) => event.lang)
          .startWith(this.translate.currentLang)
      ])
      .switchMap(([{ feature }, options, lang]) => {
        this.feature = feature;
        this.options = omit(options, ['organization']);

        return this.isariDataService
          .getHistory(this.feature, this.options, lang)
      })
      .map(logs => {
        this.labs$ = this.isariDataService.getForeignLabel('Organization', uniq(flattenDeep(logs.map(log => log.who.roles.map(role => role.lab)))))
          .map(labs => keyBy(labs, 'id'));
        return logs;
      });
  }

}
