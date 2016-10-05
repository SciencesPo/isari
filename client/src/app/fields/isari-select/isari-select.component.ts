import { Component, Input, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MdMenuTrigger } from '@angular/material';

import { IsariDataService } from '../../isari-data.service';

@Component({
  selector: 'isari-select',
  templateUrl: 'isari-select.component.html',
  styleUrls: ['isari-select.component.css']
})
export class IsariSelectComponent implements OnInit {

  @Input() name: string;
  @Input() form: FormGroup;
  @Input() field: any;
  onUpdate: EventEmitter<any>;
  @ViewChild(MdMenuTrigger) trigger: MdMenuTrigger;
  values: any[] = [];
  selectControl: FormControl;
  focused: boolean = false;

  constructor(private isariDataService: IsariDataService) { }

  ngOnInit() {
    this.selectControl = new FormControl();
    // this.selectControl.valueChanges
    //   .subscribe((value: string) => {
    //     console.log('Value changed', value);
    //   });

    this.isariDataService.getEnum(this.field.enum)
      .then(values => {
        this.values = values;
        this.setDisplayValue();
      });
  }

  update($event) {
    this.trigger.closeMenu();
    this.onUpdate.emit($event);
  }

  triggerMenu () {
    this.focused = true;
    this.trigger.openMenu();
  }

  select (value: string) {
    this.form.controls[this.name].setValue(value);
    this.form.controls[this.name].markAsDirty();
    this.setDisplayValue();
    this.update({});
  }

  private setDisplayValue () {
    this.selectControl.setValue(this.values.find(entry => entry.value === this.form.controls[this.name].value).label.fr);
  }

}
