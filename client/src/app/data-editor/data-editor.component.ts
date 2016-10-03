import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'isari-data-editor',
  templateUrl: 'data-editor.component.html',
  styleUrls: ['data-editor.component.css']
})
export class DataEditorComponent implements OnInit {

  @Input() data: any;

  constructor() { }

  ngOnInit() {
  }

}
