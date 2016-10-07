import { Component, Input, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MdMenuTrigger } from '@angular/material';

@Component({
  selector: 'isari-select',
  templateUrl: 'isari-select.component.html',
  styleUrls: ['isari-select.component.css']
})
export class IsariSelectComponent implements OnInit {

  @Input() name: string;
  @Input() form: FormGroup;
  @Input() promiseOfEnum: any | null;
  max: number = 5;

  @ViewChild(MdMenuTrigger) trigger: MdMenuTrigger;

  onUpdate: EventEmitter<any>;
  values: any[] = [];
  allValues: any[] = [];
  selectControl: FormControl;
  focused: boolean = false;
  disabled: boolean = false;

  constructor() { }

  ngOnInit() {
    this.selectControl = new FormControl({ value: null, disabled: this.form.controls[this.name].disabled });

    this.selectControl.valueChanges
      .subscribe((value: string) => {
        if (this.form.controls[this.name].value !== this.findValue(value)) {
          this.values = this.findValues(value);
        }
      });

    this.promiseOfEnum.then()
      .then(values => {
        this.allValues = values;
        this.values = this.findValues();
        this.setDisplayValue();
      });
  }

  update($event) {
    this.focused = false;
    this.trigger.closeMenu();
    this.onUpdate.emit($event);
    this.values = this.findValues(); // reset values displayed (for reopening)
  }

  openMenu() {
    this.focused = true;
    this.trigger.openMenu();
  }

  select(value: string) {
    this.form.controls[this.name].setValue(value);
    this.form.controls[this.name].markAsDirty();
    this.setDisplayValue();
    this.update({});
  }

  blur($event) {
    // ugly : avoid menu closed before value select
    setTimeout(() => {
      this.trigger.closeMenu();
    }, 100);
    this.focused = false;
  }

  private setDisplayValue () {
    const found = this.allValues.find(entry => entry.value === this.form.controls[this.name].value)
    this.selectControl.setValue(found ? found.label.fr : '');
  }

  private findValue(label: string): string {
    const item = this.allValues.find(entry => entry.label.fr === label);
    return item ? item.value : null;
  }

  private findValues(query = ''): string[] {
    query = query.toLowerCase();
    return (query
      ? this.allValues.filter(entry => entry.label.fr.toLowerCase().indexOf(query) !== -1)
      : this.allValues).slice(0, this.max);
  }

}
