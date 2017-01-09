import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'isari-textarea',
  templateUrl: './isari-textarea.component.html'
})
export class IsariTextareaComponent implements OnInit {

  @Input() name: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Input() description: string;
  @Output() onUpdate = new EventEmitter<any>();

  constructor() { }

  update($event) {
    if (this.onUpdate) {
      this.onUpdate.emit($event);
    }
  }

  ngOnInit() {
  }

}
