import { Observable } from 'rxjs/Observable';
import { FormControl, FormGroup } from '@angular/forms';
import { IsariDataService } from './../isari-data.service';
import { TranslateService } from 'ng2-translate';
import { Component, Input, OnInit, Output, EventEmitter, OnChanges } from '@angular/core';
import { EditLogApiOptions } from '../isari-logs/EditLogApiOptions.class';

import zipObject from 'lodash/zipObject';

@Component({
  selector: 'isari-log-table',
  templateUrl: './log-table.component.html',
  styleUrls: ['./log-table.component.css']
})
export class LogTableComponent implements OnInit {

  actions = ['create', 'update', 'delete'];
  whoSettings: { api: any, src: any, stringValue: any } = { api: null, src: null, stringValue: null };
  itemSettings: { api: any, src: any, stringValue: any } = { api: null, src: null, stringValue: null };
  labSettings: { api: any, src: any, stringValue: any } = { api: null, src: null, stringValue: null };
  roles: any[];
  fields: any[];
  limits: number[] = [3, 5, 10, 20, 50, 100, 200];

  filterForm: FormGroup;

  @Input() logs: any[] | null;
  @Input() labs: any[];
  @Input() feature: string;
  @Input() options: EditLogApiOptions;
  @Output() onOptionsChange = new EventEmitter();

  constructor(
    private translate: TranslateService,
    public isariDataService: IsariDataService
  ) {}

  ngOnInit() {
    this.filterForm = new FormGroup({});
    [
      'action',
      'whoID',
      'itemID',
      'isariLab',
      'isariRole',
      'startDate',
      'endDate',
      'limit',
      'path',
    ].forEach(key => {
      this.filterForm.addControl(key, new FormControl(this.options[key] || ''));
    });

    this.filterForm.valueChanges.subscribe(filters => {
      // reset skip to 0 for each filter action
      this.emitOptions(Object.assign({}, filters, { skip: 0 }));
    });

    // people autocomplete (whoID)
    this.whoSettings.src = this.isariDataService.srcForeignBuilder('people');
    this.whoSettings.stringValue = this.isariDataService.getForeignLabel('People', this.options.whoID);

    // item autocomplete (itemID)
    this.itemSettings.src = this.isariDataService.srcForeignBuilder(this.feature);
    this.itemSettings.stringValue = this.isariDataService.getForeignLabel(this.feature, this.options.itemID);

    // people autocomplete (isariLab)
    this.labSettings.src = this.isariDataService.srcForeignBuilder('organizations');
    this.labSettings.stringValue = this.isariDataService.getForeignLabel('organizations', this.options.isariLab);

    // roles select
    this.isariDataService.getEnum('isariRoles')
      .subscribe(roles => this.roles = roles.map(role => Object.assign({}, role, {
        label: role.label[this.translate.currentLang]
      })));

    // field select
    Observable.fromPromise(this.isariDataService.getSchema(this.feature))
      .subscribe(schema =>
        this.fields = Object.keys(schema).reduce((acc, value) =>
          ([...acc, { value, label: schema[value].label[this.translate.currentLang] } ])
      , []))
  }

  navigatePrev() {
    this.emitOptions(Object.assign(this.options, {
      skip: Math.max(0, this.options.skip - this.options.limit)
    }));
  }

  navigateNext() {
    //@TODO handle end via count query
    this.emitOptions(Object.assign(this.options, {
      skip: this.options.skip + this.options.limit
    }));
  }

  toggle(log, evt) {
    log._open = !log._open;
  }

  private emitOptions(options) {
    this.logs = null;
    this.onOptionsChange.emit(Object.assign({}, this.options, options));
  }

}
