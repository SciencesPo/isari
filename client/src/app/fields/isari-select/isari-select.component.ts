import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

const UP_ARROW = 38;
const DOWN_ARROW = 40;
const RIGHT_ARROW = 39;
const LEFT_ARROW = 37;
const ENTER = 13;
const TAB = 9;

@Component({
  selector: 'isari-select',
  templateUrl: 'isari-select.component.html',
  styleUrls: ['isari-select.component.css']
})
export class IsariSelectComponent implements OnInit {

  @Input() name: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Output() onUpdate = new EventEmitter<any>();
  @Input() src: Promise<any>;

  max: number = 20;
  values: any[] = [];
  allValues: any[] = [];
  selectControl: FormControl;
  focused: boolean = false;
  disabled: boolean = false;
  currentIndex = -1;

  constructor() { }

  ngOnInit() {
    this.selectControl = new FormControl({
      value: this.form.controls[this.name].value ? ' ' : '',
      disabled: this.form.controls[this.name].disabled
    });

    this.src.then()
      .then(values => {
        this.allValues = values;
        this.values = this.findValues();

        this.setDisplayValue();

        this.selectControl.valueChanges
          .subscribe((value: string) => {
            if (this.form.controls[this.name].value !== this.findValue(value)) {
              this.values = this.findValues(value);
            }
          });

      });
  }

  onFocus($event) {
    this.focused = true;
  }

  onBlur($event) {
    this.focused = false;
  }

  onSelect(idx: number) {
    this.currentIndex = idx;
    this.form.controls[this.name].setValue(this.values[this.currentIndex].value);
    this.form.controls[this.name].markAsDirty();
    this.setDisplayValue();
    this.update({});
  }

  onKey($event) {
    if ($event.keyCode === DOWN_ARROW) {
      this.currentIndex = Math.min(this.currentIndex + 1, this.values.length - 1);
    } else if ($event.keyCode === UP_ARROW) {
      this.currentIndex = Math.max(this.currentIndex - 1, 0);
    } else if ($event.keyCode === ENTER && this.currentIndex >= 0) {
      this.onSelect(this.currentIndex);
    }
  }

  update($event) {
    this.onUpdate.emit($event);
    this.values = this.findValues(); // reset values displayed (for reopening)
  }

  private setDisplayValue () {
    const found = this.allValues.find(entry => entry.value === this.form.controls[this.name].value);
    this.selectControl.setValue(found ? found.label.fr : '');
    this.selectControl.markAsDirty();
  }

  private findValue(label: string): string {
    const item = this.allValues.find(entry => entry.label.fr === label);
    return item ? item.value : null;
  }

  private findValues(query = ''): string[] {
    query = this.normalize(query.toLowerCase());
    return (query
      ? this.allValues.filter(entry => this.normalize(entry.label.fr.toLowerCase()).indexOf(query) !== -1)
      : this.allValues).slice(0, this.max);
  }

  private normalize(str: string): string {
    return str.normalize('NFKD').replace(/[\u0300-\u036F]/g, '')
  }

}
