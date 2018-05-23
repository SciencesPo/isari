import { StorageService } from './../storage.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import { FormControl, FormGroup } from '@angular/forms';
import { IsariDataService } from './../isari-data.service';
import { TranslateService } from 'ng2-translate';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import sortBy from 'lodash/sortBy';
import { EditLogApiOptions } from '../isari-logs/EditLogApiOptions.class';


@Component({
  selector: 'isari-log-table',
  templateUrl: './log-table.component.html',
  styleUrls: ['./log-table.component.css']
})
export class LogTableComponent implements OnInit, OnChanges {

  actions = ['create', 'update', 'delete'];
  whoSettings: { api: any, src: any, stringValue: any } = { api: null, src: null, stringValue: null };
  itemSettings: { api: any, src: any, stringValue: any } = { api: null, src: null, stringValue: null };
  labSettings: { api: any, src: any, stringValue: any } = { api: null, src: null, stringValue: null };
  roles: any[];
  fields: any[];
  accessMonitorings: any[];
  limits: number[] = [3, 5, 10, 20, 50, 100, 200];
  firstIndex: number;
  lastIndex: number;

  filterForm: FormGroup;

  @Input() data: { count: number, logs: any[] } | null;
  @Input() labs: any[];
  @Input() feature: string;
  @Input() options: EditLogApiOptions;
  @Input() hideItemCol: boolean = false;
  @Output() onOptionsChange = new EventEmitter();
  @Output() onDetailsToggle = new EventEmitter();
  @Output() onExport = new EventEmitter();

  constructor(
    private translate: TranslateService,
    public isariDataService: IsariDataService,
    private storageService: StorageService
  ) { }

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
      'accessMonitoring',
    ].forEach(key => {
      this.filterForm.addControl(key, new FormControl(this.options[key] || ''));
    });

    this.filterForm.valueChanges.subscribe(filters => {
      // reset skip to 0 for each filter action
      this.emitOptions(Object.assign({}, filters, { skip: 0 }));
    });

    // set itemsPerPage
    this.filterForm.controls['limit'].setValue(this.storageService.get('itemsPerPage', 'history') || 10);

    // store item per page
    this.filterForm.controls['limit'].valueChanges
      .filter(x => !!x) // ignore reset
      .subscribe(value => {
        this.storageService.save(value, 'itemsPerPage', 'history');
      });

    this.computeIndices();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.computeIndices();
    }

    if (changes['feature']) {

      if (this.filterForm) {
        this.filterForm.reset();
        this.filterForm.controls['limit'].setValue(this.storageService.get('itemsPerPage', 'history') || 10);
      }

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

      // roles select
      this.isariDataService.getEnum('accessMonitoring')
        .subscribe(vals => this.accessMonitorings = vals.map(val => Object.assign({}, val, {
          label: val.label[this.translate.currentLang]
        })));

      // field select
      Observable.fromPromise(this.isariDataService.getSchema(this.feature))
        .subscribe(schema =>
          this.fields = sortBy(Object.keys(schema).reduce((acc, value) =>
            ([...acc, { value, label: schema[value].label[this.translate.currentLang] }])
            , []), 'label'));
    }

  }

  computeIndices() {
    if (!this.data) {
      this.firstIndex = this.lastIndex = null;
    } else {
      this.firstIndex = this.options.skip + 1;
      this.lastIndex = this.firstIndex + this.data.logs.length - 1;
    }
  }

  hasPagination() {
    return this.data && this.data.count > this.options.limit
  }
  hasNext() {
    return this.hasPagination() && this.lastIndex <= this.data.count
  }
  hasPrev() {
    return this.hasPagination() && this.firstIndex > 1
  }

  navigatePrev() {
    if (this.options.skip === 0) return;
    this.emitOptions(Object.assign(this.options, {
      skip: Math.max(0, this.options.skip - this.options.limit)
    }));
  }

  navigateNext() {
    if (this.data.logs.length === 0) return;
    //@TODO handle end via count query
    this.emitOptions(Object.assign(this.options, {
      skip: this.options.skip + this.options.limit
    }));
  }

  toggle(log, evt) {
    log._open = !log._open;
  }

  toggleView() {
    this.onDetailsToggle.emit();
  }

  export(filetype) {
    this.onExport.emit({
      logs: this.data.logs,
      filetype
    });
  }

  private emitOptions(options) {
    this.data = null;
    this.onOptionsChange.emit(Object.assign({}, this.options, options));
  }

}
