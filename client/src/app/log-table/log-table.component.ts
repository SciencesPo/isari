import { FormControl } from '@angular/forms';
import { IsariDataService } from './../isari-data.service';
import { TranslateService } from 'ng2-translate';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'isari-log-table',
  templateUrl: './log-table.component.html',
  styleUrls: ['./log-table.component.css']
})
export class LogTableComponent implements OnInit {

  filters = {};
  actions = [
    { value: '', label: 'all' },
    { value: 'create', label: 'create' },
    { value: 'update', label: 'update' },
    { value: 'delete', label: 'delete' }
  ];

  @Input() logs: any[];
  @Input() labs: any[];
  @Input() feature: string;
  @Input() options: { id?: string, skip?: number, limit?: number, action?: string };
  @Output() onOptionsChange = new EventEmitter();

  constructor(
    private translate: TranslateService
  ) {}

  ngOnInit() {
    [
      'action'
    ].forEach(key => {
      this.filters[key] = new FormControl(this.options[key] || '');
      this.filters[key].valueChanges.subscribe(this.changeFilter('action'));
    });
  }

  navigatePrev() {
    this.emitChange('skip', Math.max(0, this.options.skip - this.options.limit));
  }

  navigateNext() {
    //@TODO handle end via count query
    this.emitChange('skip', this.options.skip + this.options.limit);
  }

  private changeFilter(key) {
    return value => this.emitChange(key, value);
  }

  private emitChange(key, value) {
    this.onOptionsChange.emit(Object.assign(this.options, {
      [key]: value
    }));
  }

}
