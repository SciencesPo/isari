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

  actions = [
    { value: '', label: 'all' },
    { value: 'create', label: 'create' },
    { value: 'update', label: 'update' },
    { value: 'delete', label: 'delete' }
  ];
  field: { api: any, src: any, stringValue: any } = { api: null, src: null, stringValue: null };

  filterForm: FormGroup;

  @Input() logs: any[];
  @Input() labs: any[];
  @Input() feature: string;
  @Input() options: { id?: string, skip?: number, limit?: number, action?: string, whoID: string };
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
    ].forEach(key => {
      this.filterForm.addControl(key, new FormControl(this.options[key] || ''));
    });

    this.filterForm.valueChanges.subscribe(values => {
      this.onOptionsChange.emit(Object.assign({}, this.options, values));
    });

    // people autocomplete (whoID)
    this.field.api = this.isariDataService.getSchemaApi('people');
    this.field.src = this.isariDataService.srcForeignBuilder('people');
    this.field.stringValue = this.isariDataService.getForeignLabel('People', this.options.whoID);
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
