import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'isari-chart',
  templateUrl: './isari-chart.component.html',
  styleUrls: ['./isari-chart.component.css']
})
export class IsariChartComponent implements OnInit, OnChanges {

  @Input() data: any[];
  @Input() feature: string;

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      console.log(this.data);
    }
  }

}
