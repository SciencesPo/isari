import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { TranslateService, LangChangeEvent } from 'ng2-translate';

@Component({
  selector: 'isari-date',
  templateUrl: 'isari-date.component.html',
  styleUrls: ['isari-date.component.css']
})
export class IsariDateComponent implements OnInit {

  @Input() name: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Input() requirement: string;
  @Input() description: string;
  @Output() onUpdate = new EventEmitter<any>();

  selectControl: FormControl;
  focused: boolean = false;
  disabled: boolean = false;
  displayed: string = 'days';
  year: number;
  month: number | null;
  day: number | null;
  days: any[];
  months: any = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    .map(i => new Date(1, i + 1))
    .reduce((acc, d) => Object.assign(acc, {
      fr: [...acc.fr,  d.toLocaleString('fr', { month: 'long' })],
      en: [...acc.en,  d.toLocaleString('en', { month: 'long' })]
    }), {fr: [], en: []});
  years: number[];
  runningClick = false;
  lang: string;

  constructor(private translate: TranslateService) {
    this.year = (new Date()).getFullYear();
  }

  ngOnInit() {
    this.lang = this.translate.currentLang;
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.lang = event.lang;
    });

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

  onFocus($event) {
    this.focused = true;
  }

  onBlur($event) {
    if (!this.runningClick) {
      this.focused = false;
    } else {
      this.runningClick = false;
    }
  }

  update($event) {
    this.form.controls[this.name].setValue([
      this.pad(this.year, 4),
      this.pad(this.month, 2),
      this.pad(this.day, 2)
    ].filter(v => !!v).join('-'));
    this.form.controls[this.name].markAsDirty();

    this.selectControl.setValue(this.getDisplayedValue(this.year, this.month, this.day));

    this.display('days');

    this.focused = false;
    this.runningClick = false;

    this.onUpdate.emit($event);
  }

  display(_displayed) {
    this.runningClick = true;
    if (_displayed === 'months' && !this.year) {
      return;
    }
    if (_displayed === 'days' && !this.month) {
      return;
    }
    this.displayed = _displayed;
  }

  setDay(d, $event) {
    this.day = d;
    this.display('days');
  }

  setMonth(m , $event) {
    this.month = m;
    this.days = this.setDays(this.year, this.month);
    this.display('months');
    if (!this.month) {
      this.day = null;
    }
  }

  setYear(y, $event) {
    this.year = y;
    this.display('months');
    if (!this.year) {
      this.month = null;
      this.day = null;
    }
  }

  deleteDate(y,$event) {
    this.year = y;
    this.month = null;
    this.day = null;
    this.display('years');
  }

  navigateYears(y, $event) {
    this.years = this.setYears(y);
  }

  private getDisplayedValue (year, month, day) {
    if (!year) {
      return '';
    }
    return (day ? day + ' ' : '')
      + (month ? this.months[this.lang][month - 1] + ' ' : '')
      + year;
  }

  private setYears (y) {
    return [...Array.apply(null, {length: 13}).map((v, i) => i + y - 5)];
  }

  private setDays (year, month) {
    if (!year || !month) {
      return [];
    }
    const daysInMonth = new Date(+year, +month, 0).getDate();
    return [...Array.apply(null, {length: daysInMonth}).map((v, i) => i + 1)];
  }

  private pad(n: number, size: number): string | null {
    if (!n) {
      return null;
    }
    return ('0000' + n).substr(-size, size);
  }

}
