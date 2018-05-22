import { LoaderService } from './../loader/loader.service';
import { Component, OnInit, ViewContainerRef, Input, HostListener, Inject, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { TranslateService, LangChangeEvent } from 'ng2-translate';
import { ToasterService } from 'angular2-toaster/angular2-toaster';

import { IsariDataService } from '../isari-data.service';
import { UserService } from '../user.service';
import { matchKeyCombo } from '../utils';

import get from 'lodash/get';
import keyBy from 'lodash/keyBy';
import flattenDeep from 'lodash/flattenDeep';
import uniq from 'lodash/uniq';

import { MatDialogRef, MatDialog } from '@angular/material';
import { ConfirmDialog } from '../fields/confirm.component';
import { PageScrollService, PageScrollInstance, PageScrollConfig } from 'ng2-page-scroll';
import { DOCUMENT } from '@angular/platform-browser';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/startWith';
import { EditLogApiOptions } from '../isari-logs/EditLogApiOptions.class';

@Component({
  selector: 'isari-editor',
  templateUrl: './isari-editor.component.html',
  styleUrls: ['./isari-editor.component.css']
})
export class IsariEditorComponent implements OnInit, OnDestroy {
  dialogRef: MatDialogRef<ConfirmDialog>;

  @Input() id: number;
  @Input() feature: string;
  @Input() saveShortcut: Array<string> = ['Ctrl+s'];
  data: any;
  layout: any;
  lang: string;
  diff: Array<any> = [];
  form: FormGroup;
  deletable = false;
  relations: { label: string, value: Array<any>, show: boolean, feature: string }[];
  exist = false;
  private errors: any;
  organization: string;
  sub: Subscription;
  messageQueryError: string;

  // history (logs)
  displayHistory = false;
  options: EditLogApiOptions = { skip: 0, limit: 5 };
  options$: BehaviorSubject<EditLogApiOptions>;
  details$: BehaviorSubject<boolean>;
  logs$: Observable<any[]>;
  labs$: Observable<any[]>;

  private pressedSaveShortcut: Function;

  constructor(
    private pageScrollService: PageScrollService,
    @Inject(DOCUMENT) private document: any,
    private router: Router,
    private route: ActivatedRoute,
    private isariDataService: IsariDataService,
    private userService: UserService,
    private translate: TranslateService,
    private toasterService: ToasterService,
    private viewContainerRef: ViewContainerRef,
    private titleService: Title,
    private dialog: MatDialog,
    private loaderService: LoaderService) {
    PageScrollConfig.defaultScrollOffset = 50;
    PageScrollConfig.defaultDuration = 500;
  }

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

    this.route.queryParams.subscribe(({ organization }) => this.organization = organization);

    this.sub = Observable.combineLatest(
      $routeParams,
      this.userService.getRestrictedFields(),
      this.translate.onLangChange
        .map((event: LangChangeEvent) => event.lang)
        .startWith(this.translate.currentLang)
    ).subscribe(([{ feature, id }, restrictedFields, lang]) => {
      this.loaderService.show();
      this.feature = feature;
      this.id = id;
      Promise.all([
        this.isariDataService.getData(this.feature, id ? String(id) : null)
          .catch(err => {
            this.loaderService.hide();
            const json = err.json();
            this.messageQueryError = err.status;

            return Promise.reject(err);
          }),
        this.isariDataService.getLayout(this.feature),
        this.isariDataService.getRelations(this.feature, id ? String(id) : null)
          .catch(err => {
            return Promise.reject(err);
          })
      ]).then(([data, layout, relations]) => {
        this.errors = {};

        this.relations = Object.keys(relations).map(key => ({
          value: relations[key],
          label: `linked${key}`,
          show: false,
          feature: this.isariDataService.getSchemaApi(key)
        }));

        this.deletable = this.relations.reduce((acc, i) => acc && !i.value.length, true);

        if (data.firstName && data.name) {
          this.titleService.setTitle([data.name, data.firstName].filter(x => !!x).join(' '));
        } else if (data.name) {
          this.titleService.setTitle(data.name);
        }

        this.exist = true;
        this.data = data;
        this.data.opts = Object.assign({ editable: true }, this.data.opts || {}, {
          restrictedFields: restrictedFields[feature],
          path: []
        });

        layout = this.isariDataService.translate(layout, lang);
        layout = this.isariDataService.closeAll(layout);
        this.form = this.isariDataService.buildForm(layout, this.data, true);
        this.layout = this.isariDataService.rows(layout);

        // disabled all form
        if (this.data.opts && this.data.opts.editable === false) {
          this.form.disable();
        }

        // scroll to form
        setTimeout(() => {
          this.loaderService.hide();
          let pageScrollInstance: PageScrollInstance = PageScrollInstance.simpleInstance(this.document, '#form');
          this.pageScrollService.start(pageScrollInstance);
        });

      })
        .catch(err => {
          // console.log('err', err)
        });
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown($event) {
    if (this.pressedSaveShortcut($event)) {
      $event.view.document.activeElement.blur(); // fire blur : force update before save
      $event.preventDefault();
      this.save($event);
    }
    if ($event.keyCode === 27) { // ESC
      $event.view.document.activeElement.blur();
    }
  }

  save($event) {
    if (!this.form.disabled && this.form.valid && !!this.diff.length) {
      let payload;

      // Different payload for creation & update
      if (this.id) {
        payload = { id: this.id, diff: this.diff };
      }
      else {
        payload = this.form.value;
      }

      this.isariDataService.save(
        this.feature,
        payload
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
      this.toasterService.pop('error', 'Save', `Merci de corriger les erreurs sur ces champs : ${Object.keys(this.errors).map(err => this.errors[err].label).join(', ')}`);
    }
  }

  cumulError($event) {
    if ($event.errors) {
      this.errors[$event.path] = $event;
    } else if (this.errors[$event.path]) {
      delete this.errors[$event.path];
    }
  }

  delete($event) {
    $event.preventDefault();
    if (this.deletable) {
      this.dialogRef = this.dialog.open(ConfirmDialog, {
        disableClose: false
      });

      this.dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.isariDataService.removeData(this.feature, this.data.id)
            .then(() => this.exist = false) //this.router.navigate(['/', this.feature, { outlets: { editor: null } }], { preserveQueryParams: true }));
            .then(() => this.toasterService.pop('success', 'Delete', 'Success'));
        }
        this.dialogRef = null;
      });
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

    // Else we need a value
    else if ($event.type === 'update') {
      diff.value = ('value' in $event) ? $event.value : get(this.form.value, diff.path);
    }

    else if ($event.type === 'push') {
      diff.value = get(this.form.value, diff.path).slice(-1)[0];
    }

    else if ($event.type === 'unshift') {
      diff.value = get(this.form.value, diff.path)[0];
    }

    this.diff.push(diff);
  }

  history() {
    if (!this.id) return;
    this.displayHistory = !this.displayHistory;
    if (!this.displayHistory) return

    this.options$ = new BehaviorSubject(this.options);
    this.details$ = new BehaviorSubject(false);
    this.logs$ = Observable
      .combineLatest([
        this.route.paramMap,
        this.options$,
        this.translate.onLangChange
          .map((event: LangChangeEvent) => event.lang)
          .startWith(this.translate.currentLang)
      ])
      .switchMap(([paramMap, options, lang]) => {
        //this.feature = (<ParamMap>paramMap).get('feature');
        // this.options = Object.assign({}, {
        //   itemID: (<ParamMap>paramMap).get('itemID')
        // }, options);

        this.options = Object.assign({}, options, {
          itemID: String(this.id)
        });

        return this.isariDataService
          .getHistory(this.feature, this.options, lang)
          .combineLatest(this.details$)
      })
      .map(([{ count, logs }, details]) => {
        this.labs$ = this.isariDataService.getForeignLabel('Organization', uniq(flattenDeep(logs.map(log => log.who.roles.map(role => role.lab)))))
          .map(labs => keyBy(labs, 'id'));

        if (details && this.options['path']) return logs.map(log => Object.assign({}, log, {
          _open: true,
          diff: log.diff.filter(diff => diff.path[0] === this.options['path'])
        }));

        return {
          count,
          logs: logs.map(log => Object.assign({}, log, { _open: details }))
        };
      });
  }

  changeOpt(options) {
    this.options = options;
    this.options$.next(options);
  }

  toggleDetails() {
    this.details$.next(!this.details$.value);
  }

  exportLogs({ logs, filetype }) {
    this.isariDataService.exportLogs(logs, this.feature, this.labs$, this.translate, this.details$.value, filetype);
  }

}
