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

  constructor() { }

  ngOnInit() {
    // save every 1s on change
    this.form.controls[this.name].valueChanges
      .debounceTime(1000)
      .subscribe((value: string) => {
        this.update({});
      });
  }

  update($event) {
    this.onUpdate.emit($event);
  }

}
