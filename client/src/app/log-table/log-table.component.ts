import { Observable } from 'rxjs/Observable';
import { FormControl, FormGroup } from '@angular/forms';
import { IsariDataService } from './../isari-data.service';
import { TranslateService } from 'ng2-translate';
import { Component, Input, OnInit, Output, EventEmitter, OnChanges } from '@angular/core';

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

  filterForm: FormGroup;

  @Input() logs: any[];
  @Input() labs: any[];
  @Input() feature: string;
  @Input() options: { itemID?: string, skip?: number, limit?: number, action?: string, whoID?: string, isariLab?: string };
  @Output() onOptionsChange = new EventEmitter();

  constructor(
    private translate: TranslateService,
    private isariDataService: IsariDataService
  ) {}

  ngOnInit() {
    this.filterForm = new FormGroup({});
    [
      'action',
      'whoID',
      'itemID',
      'isariLab',
      'isariRole',
    ].forEach(key => {
      this.filterForm.addControl(key, new FormControl(this.options[key] || ''));
    });

    this.filterForm.valueChanges.subscribe(values => {
      this.onOptionsChange.emit(Object.assign({}, this.options, values));
    });

    // people autocomplete (whoID)
    this.whoSettings.api = this.isariDataService.getSchemaApi('people');
    this.whoSettings.src = this.isariDataService.srcForeignBuilder('people');
    this.whoSettings.stringValue = this.isariDataService.getForeignLabel('People', this.options.whoID);

    // item autocomplete (itemID)
    this.itemSettings.api = this.isariDataService.getSchemaApi(this.feature);
    this.itemSettings.src = this.isariDataService.srcForeignBuilder(this.feature);
    this.itemSettings.stringValue = this.isariDataService.getForeignLabel(this.feature, this.options.itemID);

    // people autocomplete (isariLab)
    this.labSettings.api = this.isariDataService.getSchemaApi('organizations');
    this.labSettings.src = this.isariDataService.srcForeignBuilder('organizations');
    this.labSettings.stringValue = this.isariDataService.getForeignLabel('organizations', this.options.isariLab);

    this.isariDataService.getEnum('isariRoles')
      .subscribe(roles => this.roles = roles.map(role => Object.assign({}, role, {
        label: role.label[this.translate.currentLang]
      })));

  }

  navigatePrev() {
    this.emitChange('skip', Math.max(0, this.options.skip - this.options.limit));
  }

  navigateNext() {
    //@TODO handle end via count query
    this.emitChange('skip', this.options.skip + this.options.limit);
  }

  private emitChange(key, value) {
    this.onOptionsChange.emit(Object.assign(this.options, { [key]: value }));
  }

}
