import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'isari-data-table',
  templateUrl: 'data-table.component.html',
  styleUrls: ['data-table.component.css']
})
export class DataTableComponent implements OnInit {

  @Input('data') dataObs: Observable<any>;

  @Output() change = new EventEmitter();

  data: Array<any>;

  constructor() { }

  ngOnInit() {
    this.dataObs.subscribe(
      data => { this.data = data; }
    );
  }

  filter () {
    this.change.emit({ filter: 'yeah!' });
  }

}
