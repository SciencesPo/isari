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
  @Input() field: any;

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

    function chunk(array: any[], size: number) {
      let ceil = Math.ceil;
      return Array( ceil(array.length / size) )
        .fill(null)
        .map((_, i) => array.slice(i * size, i * size + size));
    }

    [this.year, this.month, this.day] = this.form.controls[this.name].value.split('-').map(v => Number(v));
    this.selectControl = new FormControl({
      value: this.getDisplayedValue(this.year, this.month, this.day),
      disabled: this.form.controls[this.name].disabled
    });

    const daysInMonth = new Date(+this.year, +this.month, 0).getDate();
    this.days = ['-', '-', ...Array.apply(null, {length: daysInMonth}).map((v, i) => i + 1)];
    this.days = chunk(this.days, 7);
    this.days[0].shift();

    this.years = this.setYears(this.year);
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
    this.display('years');
  }

  setYear(y, $event) {
    $event.stopPropagation();
    this.year = y;
  }

  navigateYears(y, $event) {
    $event.stopPropagation();
    this.years = this.setYears(y);
  }

  private setYears (y) {
    return Array.apply(null, {length: 20}).map((v, i) => i + y - 10);
  }

  private getDisplayedValue (year, month, day) {
    return (day ? day + ' ' : '')
      + (month ? this.months['fr'][month] + ' ' : '')
      + year;
  }

}
