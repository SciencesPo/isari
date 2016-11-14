import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'isari-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.css']
})
export class SpinnerComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    console.log('isari-spinner');
  }

}
