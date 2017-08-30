import { IsariDataService } from './../isari-data.service';
import { TranslateService } from 'ng2-translate';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'isari-log-table',
  templateUrl: './log-table.component.html',
  styleUrls: ['./log-table.component.css']
})
export class LogTableComponent implements OnInit {

  @Input() logs: any[];
  @Input() labs: any[];
  @Input() feature: string;
  @Input() options: { id?: string, skip?: number, limit?: number };
  @Output() onOptionsChange = new EventEmitter();

  constructor(
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  navigatePrev() {
    this.onOptionsChange.emit(Object.assign(this.options, {
      skip: Math.max(0, this.options.skip - this.options.limit)
    }));
  }

  navigateNext() {
    this.onOptionsChange.emit(Object.assign(this.options, {
      skip: this.options.skip + this.options.limit
    }));
  }

}
