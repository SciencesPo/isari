import { Component, OnInit, ViewContainerRef, Input, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { TranslateService, LangChangeEvent } from 'ng2-translate';
import { ToasterService } from 'angular2-toaster/angular2-toaster';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/startWith';
import { IsariDataService } from '../isari-data.service';
import { UserService } from '../user.service';
import { matchKeyCombo } from '../utils';
import get from 'lodash/get';

@Component({
  selector: 'isari-editor',
  templateUrl: './isari-editor.component.html',
  styleUrls: ['./isari-editor.component.css']
})
export class IsariEditorComponent implements OnInit {

  @Input() id: number;
  @Input() feature: string;
  @Input() saveShortcut: Array<string> = ['Ctrl+s'];
  data: any;
  layout: any;
  lang: string;
  diff: Array<any> = [];
  form: FormGroup;

  private pressedSaveShortcut: Function;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private isariDataService: IsariDataService,
    private userService: UserService,
    private translate: TranslateService,
    private toasterService: ToasterService,
    private viewContainerRef: ViewContainerRef,
    private titleService: Title) {}

  ngOnInit() {
    this.lang = this.translate.currentLang;
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.lang = event.lang;
    });

    this.pressedSaveShortcut = matchKeyCombo(this.saveShortcut);

    let $routeParams =
      // Feature and id provided as Input: just use this
      (this.id && this.feature)
      ? Observable.of({ feature: this.feature, id: this.id })
      // Otherwise, feature & id can come from parent or current route
      : this.route.parent
      ? Observable
        .combineLatest(this.route.parent.params, this.route.params)
        .map(([x, y]) => Object.assign({}, x, y))
      : this.route.params;

    Observable.combineLatest(
      $routeParams,
      this.userService.getRestrictedFields(),
      this.translate.onLangChange
        .map((event: LangChangeEvent) => event.lang)
        .startWith(this.translate.currentLang)
    ).subscribe(([{ feature, id }, restrictedFields, lang]) => {
      this.feature = feature;
      this.id = id;
      Promise.all([
        this.isariDataService.getData(this.feature, id ? String(id) : null),
        this.isariDataService.getLayout(this.feature)
      ]).then(([data, layout]) => {

        if (data.firstName && data.name) {
          this.titleService.setTitle([data.name, data.firstName].filter(x => !!x).join(' '));
        } else if (data.name) {
          this.titleService.setTitle(data.name);
        }

        this.data = data;
        this.data.opts = Object.assign({ editable: true }, this.data.opts || {}, {
          restrictedFields: restrictedFields[feature],
          path: []
        });

        layout = this.isariDataService.translate(layout, lang);
        layout = this.isariDataService.closeAll(layout);
        this.form = this.isariDataService.buildForm(layout, this.data);
        this.layout = this.isariDataService.rows(layout);

        // disabled all form
        if (this.data.opts && this.data.opts.editable === false) {
          this.form.disable();
        }
      });
    });
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown($event) {
    if (this.pressedSaveShortcut($event)) {
      $event.preventDefault();
      this.save($event);
    }
    if ($event.keyCode === 27) { // ESC
      $event.view.document.activeElement.blur();
    }
  }

  save($event) {
    if (!this.form.disabled && this.form.valid && !!this.diff.length) {
      this.isariDataService.save(
        this.feature,
        {id: this.id, diff: this.diff}
      ).then(data => {
          if (this.id !== data.id) {
            this.router.navigate([this.feature, data.id]);
          }
          this.toasterService.pop('success', 'Save', 'Success');
        })
        .catch(err => {
          this.toasterService.pop('error', 'Save', 'Error');
        });

      // Clearing the diff
      this.diff = [];
    }
    if (!this.form.valid) {
      // let errors = this.isariDataService.getErrorsFromControls(this.form.controls);
      // console.log(errors);
      this.toasterService.pop('error', 'Save', 'Save error');
    }
  }

  onUpdate($event) {

    // Filtering form log events
    if (!$event || !$event.log)
      return;

    const diff = {
      type: $event.type,
      path: $event.path.split('.'),
      value: undefined,
      index: undefined
    };

    // We need the index in case of deletion
    if ($event.type === 'delete') {
      diff.index = $event.index;
    }

    // We need the value in case of update
    if ($event.type === 'update') {
      diff.value = get(this.form.value, diff.path);
    }

    this.diff.push(diff);
  }
}
