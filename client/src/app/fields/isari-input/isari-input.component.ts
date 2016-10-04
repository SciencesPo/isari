import { Component, Input, OnInit, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'isari-input',
  templateUrl: 'isari-input.component.html'
})
export class IsariInputComponent implements OnInit {

  @Input() name: string;
  @Input() form: FormGroup;
  onUpdate: EventEmitter<any>;
  mode: string = 'display';

  constructor() { }

  ngOnInit() {
  }

  update($event) {
    this.toggleMode();
    this.onUpdate.emit($event);
  }

  toggleMode () {
    this.mode = this.mode === 'edit' ? 'display' : 'edit';
  }

}
