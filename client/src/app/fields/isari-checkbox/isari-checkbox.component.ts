import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'isari-checkbox',
  templateUrl: './isari-checkbox.component.html'
})
export class IsariCheckboxComponent implements OnInit {

  @Input() name: string;
  @Input() path: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Input() description: string;
  @Output() onUpdate = new EventEmitter<any>();

  constructor() { }

  update($event) {
    if (this.onUpdate) {
      this.onUpdate.emit({log: true, path: this.path, type: 'update'});
    }
  }

  ngOnInit() {
  }

}
