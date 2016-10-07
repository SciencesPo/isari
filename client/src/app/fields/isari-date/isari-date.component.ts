import { Component, Input, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MdMenuTrigger } from '@angular/material';

@Component({
  selector: 'isari-date',
  templateUrl: 'isari-date.component.html',
  styleUrls: ['isari-date.component.css']
})
export class IsariDateComponent implements OnInit {

  @Input() name: string;
  @Input() form: FormGroup;

  @ViewChild(MdMenuTrigger) trigger: MdMenuTrigger;

  onUpdate: EventEmitter<any>;
  selectControl: FormControl;
  focused: boolean = false;
  disabled: boolean = false;
  displayed: string = 'days';
  year: number;
  month: number | null;
  day: number | null;
  days: any[];
  months: any = {
    fr: ['-', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  };
  years: number[];

  constructor() {
    this.year = (new Date()).getFullYear();
  }

  ngOnInit() {
    [this.year, this.month, this.day] = this.form.controls[this.name].value.split('-').map(v => Number(v));

    this.selectControl = new FormControl({
      value: this.getDisplayedValue(this.year, this.month, this.day),
      disabled: this.form.controls[this.name].disabled
    });

    if (!this.month) {
      this.display('months');
    }
    if (!this.year) {
      this.display('years');
    }

    this.days = this.setDays(this.year, this.month);
    this.years = this.setYears(this.year || new Date().getFullYear());
  }

  update($event) {
    this.form.controls[this.name].setValue([this.year, this.month, this.day].filter(v => !!v).join('-'));
    this.form.controls[this.name].markAsDirty();

    this.selectControl.setValue(this.getDisplayedValue(this.year, this.month, this.day));

    this.display('days');
    this.onUpdate.emit($event);
  }

  openMenu() {
    this.trigger.openMenu();
  }

  blur($event) {
  }

  display(_displayed) {
    if (_displayed === 'months' && !this.year) {
      return;
    }
    if (_displayed === 'days' && !this.month) {
      return;
    }
    this.displayed = _displayed;
  }

  setDay(d, $event) {
    $event.stopPropagation();
    this.day = d;
    this.display('months');
  }

  setMonth(m , $event) {
    $event.stopPropagation();
    this.month = m;
    this.days = this.setDays(this.year, this.month);
    this.display('years');
    if (!this.month) {
      this.day = null;
    }

  }

  setYear(y, $event) {
    $event.stopPropagation();
    this.year = y;
    if (!this.year) {
      this.month = null;
      this.day = null;
    }
  }

  navigateYears(y, $event) {
    $event.stopPropagation();
    this.years = this.setYears(y);
  }

  private setYears (y) {
    return ['-', ...Array.apply(null, {length: 20}).map((v, i) => i + y - 10)];
  }

  private getDisplayedValue (year, month, day) {
    if (!year) {
      return '';
    }
    return (day ? day + ' ' : '')
      + (month ? this.months['fr'][month] + ' ' : '')
      + year;
  }

  private setDays (year, month) {
    if (!year || !month) {
      return [];
    }

    const daysInMonth = new Date(+year, +month, 0).getDate();
    let days = ['-', '-', ...Array.apply(null, {length: daysInMonth}).map((v, i) => i + 1)];
    days = chunk(days, 7);
    days[0].shift();

    return days;

    function chunk(array: any[], size: number) {
      let ceil = Math.ceil;
      return Array( ceil(array.length / size) )
        .fill(null)
        .map((_, i) => array.slice(i * size, i * size + size));
    }
  }

}
