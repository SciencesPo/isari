import { IsariDataService } from './../isari-data.service';
import { TranslateService } from 'ng2-translate';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'isari-log-table',
  templateUrl: './log-table.component.html',
  styleUrls: ['./log-table.component.css']
})
export class LogTableComponent implements OnInit {

  @Input() logs: any[];
  @Input() labs: any[];
  @Input() feature: string;

  constructor(
    private translate: TranslateService
  ) {}

  ngOnInit() {
  }

}
