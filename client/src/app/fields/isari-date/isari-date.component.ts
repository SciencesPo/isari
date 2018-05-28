import { Component, Input, Output, EventEmitter, ViewChild, HostListener } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { TranslateService, LangChangeEvent } from 'ng2-translate';
import { FocusMeDirective } from '../focus-me.directive';
import { matchKeyCombo, pad, createAutoCorrectedDatePipe } from '../../utils';
import { ToasterService } from 'angular2-toaster';

@Component({
  selector: 'isari-date',
  templateUrl: './isari-date.component.html',
  styleUrls: ['./isari-date.component.css']
})
export class IsariDateComponent {

  @Input() name: string;
  @Input() path: string;
  @Input() form: FormGroup;
  @Input() label: string;
  @Input() requirement: string;
  @Input() description: string;
  @Output() onUpdate = new EventEmitter<any>();
  @Input() escapeKey: Array<string> = ['esc'];
  @Input() enterKey: Array<string> = ['enter'];
  @Input() accessMonitoring: string;

  @ViewChild(FocusMeDirective) focusMe;

  open: boolean;
  selectControl: FormControl;
  selectIsoControl: FormControl;
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
      fr: [...acc.fr, d.toLocaleString('fr', { month: 'long' })],
      en: [...acc.en, d.toLocaleString('en', { month: 'long' })]
    }), { fr: [], en: [] });
  years: number[];
  runningClick = false;
  lang: string;
  mask = [/\d/, /\d/, /\d/, /\d/, '-', /[0-1]/, /\d/, '-', /[0-3]/, /\d/];
  pipe = createAutoCorrectedDatePipe('yyyy-mm-dd');

  private pressedEscapeKey: Function;
  private pressedEnterKey: Function;

  constructor(private toasterService: ToasterService, private translate: TranslateService) {
    this.year = (new Date()).getFullYear();
  }

  toggleAccess(val, human = true) {
    this.open = val;
    if (!this.open) this.selectControl.disable();
    else {
      if (human) {
        this.translate.get('priorityField').subscribe(priorityField => {
          this.toasterService.pop('error', priorityField.title, priorityField.message);
        });
      }
      this.selectControl.enable();
    }
  }

  private init() {
    [this.year, this.month, this.day] = this.form.controls[this.name].value.split('-').map(v => Number(v));
    this.selectControl.setValue(this.getDisplayedValue(this.year, this.month, this.day));
    if (this.form.controls[this.name].disabled) this.selectControl.disable();


    if (!this.month) {
      this.display('months');
    }
    if (!this.year) {
      this.display('years');
    }

    this.focused = false;
    this.runningClick = false;

    this.days = this.setDays(this.year, this.month);
    this.years = this.setYears(this.year || new Date().getFullYear());

  }

  private ngOnInit() {
    this.lang = this.translate.currentLang;
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.lang = event.lang;
    });

    this.pressedEscapeKey = matchKeyCombo(this.escapeKey);
    this.pressedEnterKey = matchKeyCombo(this.enterKey);

    this.selectControl = new FormControl();

    this.toggleAccess(!this.accessMonitoring, false);

    this.selectIsoControl = new FormControl('');
    this.selectIsoControl.valueChanges.subscribe(value => {
      const dateArray = value.replace(/_/g, '').split('-');
      this.year = dateArray[0] && dateArray[0].length === 4 ? Number(dateArray[0]) : null;
      this.month = dateArray[1] && dateArray[1].length === 2 ? Number(dateArray[1]) : null;
      this.day = dateArray[2] && dateArray[2].length === 2 ? Number(dateArray[2]) : null;
    })

    this.init();
  }

  onFocus($event) {
    this.focused = true;
    this.selectIsoControl.setValue([
      pad(this.year, 4),
      pad(this.month, 2),
      pad(this.day, 2)
    ].filter(v => !!v).join('-'));
    setTimeout(() => this.focusMe.setFocus());
  }

  onBlur($event) {
    if (!this.runningClick) {
      this.focused = false;
      this.init();
    } else {
      this.runningClick = false;
      this.focusMe.setFocus();
    }
  }

  uneditable($event) {
    $event.preventDefault();
    return false;
  }

  update($event) {
    this.form.controls[this.name].setValue([
      pad(this.year, 4),
      pad(this.month, 2),
      pad(this.day, 2)
    ].filter(v => !!v).join('-'));
    this.form.controls[this.name].markAsDirty();

    this.selectControl.setValue(this.getDisplayedValue(this.year, this.month, this.day));

    this.display('years');

    this.focused = false;
    this.runningClick = false;

    this.onUpdate.emit({ log: true, path: this.path, type: 'update' });
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

  setMonth(m, $event) {
    this.month = m;
    this.days = this.setDays(this.year, this.month);
    this.display('days');
    if (!this.month) {
      this.day = null;
      this.display('months');
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

  deleteDate(y, $event) {
    this.year = y;
    this.month = null;
    this.day = null;
    this.display('years');
  }

  undoDate($event) {
    this.init();
    this.focused = false;
    this.runningClick = false;
  }

  navigateYears(y, $event) {
    this.years = this.setYears(y);
    this.runningClick = true;
  }

  // NOTE: fix this later
  // @HostListener('window:keydown', ['$event'])
  // onKeydown($event) {
  //   if (this.pressedEscapeKey($event)) {
  //     this.undoDate($event);
  //   }
  //   if (this.pressedEnterKey($event)) {
  //     this.update($event);
  //   }
  // }

  private getDisplayedValue(year, month, day) {
    if (!year) {
      return '';
    }
    return (day ? day + ' ' : '')
      + (month ? this.months[this.lang][month - 1] + ' ' : '')
      + year;
  }

  private setYears(y) {
    return [...Array.apply(null, { length: 13 }).map((v, i) => i + y - 5)];
  }

  private setDays(year, month) {
    if (!year || !month) {
      return [];
    }
    const daysInMonth = new Date(+year, +month, 0).getDate();
    return [...Array.apply(null, { length: daysInMonth }).map((v, i) => i + 1)];
  }

}
