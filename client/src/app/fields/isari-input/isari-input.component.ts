import { Component, Input, EventEmitter, Output, OnInit, OnChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ToasterService } from 'angular2-toaster';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'isari-input',
  templateUrl: './isari-input.component.html',
  styleUrls: ['./isari-input.component.css']

})
export class IsariInputComponent implements OnInit, OnChanges {

  open: boolean;
  @Input() name: string;
  @Input() path: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Input() description: string;
  @Input() type: string = 'text';
  @Input() min: number;
  @Input() max: number;
  @Input() step: number;
  @Input() accessMonitoring: string;
  @Output() onUpdate = new EventEmitter<any>();
  hasChange: boolean = false;
  @Input() am: number = 0;

  constructor(private toasterService: ToasterService, private translate: TranslateService) { }

  update($event) {
    if (!this.hasChange) return;
    if (this.type === 'number' && Number.isNaN(this.form.controls[this.name].value)) {
      this.form.controls[this.name].setValue(null);
    }
    if (this.onUpdate) {
      this.onUpdate.emit({ log: true, path: this.path, type: 'update' });
    }
  }

  ngOnInit() {
    // this.toggleAccess(!this.accessMonitoring, false);
  }

  ngOnChanges(changes) {
    if (changes['am']) {
      if (this.am === 1) {
        this.form.controls[this.name].disable();
      }
      if (this.am === 2) {
        this.form.controls[this.name].enable();
      }
    }
  }

  toggleAccess(val, human = true) {
    this.open = val;
    if (!this.open) this.form.controls[this.name].disable();
    else {
      if (human) {
        this.translate.get('priorityField').subscribe(priorityField => {
          this.toasterService.pop('error', priorityField.title, priorityField.message);
        });
      }
      this.form.controls[this.name].enable();
    }
  }

}
