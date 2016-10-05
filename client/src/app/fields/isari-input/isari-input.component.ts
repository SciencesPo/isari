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
    console.log(this.form.controls[this.name], this.name);
    // this.form.controls[this.name].statusChanges.subscribe((newStatus) => {
    //   console.log(newStatus);
    //   this.form.controls[this.name].disable();
    // });
  }

  update($event) {
    this.onUpdate.emit($event);
  }

}
