// tslint:disable:curly

import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/publishReplay';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/concatAll';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/last';
import 'rxjs/add/operator/do';

import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Http, RequestOptions, URLSearchParams } from '@angular/http';
import { get, sortByDistance } from './utils';

import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import Papa from 'papaparse';
import { StorageService } from './storage.service';
import { UserService } from './user.service';
import _get from 'lodash/get';
import deburr from 'lodash/deburr';
import { environment } from '../environments/environment';
import flatten from 'lodash/flatten';
import intersection from 'lodash/intersection';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import keyBy from 'lodash/keyBy';
import omit from 'lodash/omit';
import { saveAs } from 'file-saver';
import startsWith from 'lodash/startsWith';
import uniq from 'lodash/uniq';
import values from 'lodash/values';
import zipObject from 'lodash/zipObject';
import { BehaviorSubject, Subject } from 'rxjs';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  CSV_MIME = 'text/csv;charset=utf-8';

const mongoSchema2Api = {
  'Organization': 'organizations',
  'People': 'people',
  'Activities': 'activities',
  'Activity': 'activities'
};

const singular = {
  'organizations': 'organization',
  'people': 'people',
  'activities': 'activity'
};

@Injectable()
export class IsariDataService {

  private enumsCache = {};
  private layoutsCache = {};
  private schemasCache = {};
  private columnsCache = null;
  private labelsCache = {};
  private tempForeignKeys = {};

  private dataUrl = `${environment.API_BASE_URL}`;
  private layoutUrl = `${environment.API_BASE_URL}/layouts`;
  private enumUrl = `${environment.API_BASE_URL}/enums`;
  private schemaUrl = `${environment.API_BASE_URL}/schemas`;
  private columnsUrl = `${environment.API_BASE_URL}/columns`;
  private exportUrl = `${environment.API_BASE_URL}/export`;
  private editLogUrl = `${environment.API_BASE_URL}/editLog`;

  constructor(private http: Http, private fb: FormBuilder, private userService: UserService, private storageService: StorageService) { }

  getHttpOptions(search: {} = null) {
    const options = new RequestOptions({ withCredentials: true });
    options.search = new URLSearchParams();
    options.search.set('organization', this.userService.getCurrentOrganizationId());
    if (search) {
      Object.keys(search).forEach(key => {
        if (search[key]) {
          options.search.set(key, search[key]);
        }
      });
    }
    return options;
  }

  getData(feature: string, id?: string) {
    if (!id) {
      return this.getEmptyDataWith({
        controlType: 'object',
        label: null,
        layout: [],
        multiple: false,
        name: '',
        type: 'object'
      }, feature);
    }
    const url = `${this.dataUrl}/${feature}/${id}`;
    return this.http.get(url, this.getHttpOptions())
      .toPromise()
      .then(response => response.json())
      .catch(this.handleError);
  }

  getDatas(feature: string,
    { fields, applyTemplates, externals, start, end, type }:
      { fields: string[], applyTemplates: boolean, externals: boolean, start: string, end: string, type: string }) {
    const url = `${this.dataUrl}/${feature}`;
    fields.push('id'); // force id

    let options = this.getHttpOptions({
      fields: fields.join(','),
      applyTemplates: (applyTemplates ? 1 : 0).toString(),
      include: externals ?
        'externals' :
        (start || end ? 'range' : 'members'),
      start: start || null,
      end: end || null,
      type: type || null
    });

    return this.http.get(url, options)
      .toPromise()
      .then(response => response.json())
      .catch(this.handleError);
  }

  private getLabel(schema, path, lang) {
    const item = _get(schema, path);
    return item && item.label ? item.label[lang] : '';
  }

  getHistory(feature: string, query: any, lang) {

    return Observable.combineLatest([
      this.http.get(`${this.editLogUrl}/${feature}`, this.getHttpOptions(query))
        .map((response) => response.json()),
      Observable.fromPromise(this.getSchema(feature)),
      this.getEnum('isariRoles')
        .map(roles => keyBy(roles, 'value')),
      this.getEnum('accessMonitoring')
        .map(vals => keyBy(vals, 'value')),
    ])

      .map(([{ count, results: logs }, schema, roles, accessMonitorings]) => {
        logs = (<any[]>logs).map(log => {

          // if query accessMonitoring, keep only diff for this accessMonitoring #433
          if (query.accessMonitoring) {
            log.accessMonitorings = log.accessMonitorings.filter(am => am === query.accessMonitoring);
            log.diff = log.diff.filter(diff => diff.accessMonitoring === query.accessMonitoring);
          }

          log.diff = log.diff.map(diff => {
            const res = Object.assign(diff, {
              // if path = [grades, grade] we get _get(schema, 'grades') then _get(schema, 'grades.grade') and we store the labels
              _label: diff.path.reduce((a, v, i, s) => [...a, this.getLabel(schema, [...s.slice(0, i), v].join('.'), lang)], []).join(' : ')
            });
            if (diff.valueBefore) {
              res._beforeLabelled$ = this.formatWithRefs(this.key2label(diff.valueBefore, diff.path, schema, lang), lang)
                .catch(() => Observable.of('ref. not found'));
            }
            if (diff.valueAfter) {
              res._afterLabelled$ = this.formatWithRefs(this.key2label(diff.valueAfter, diff.path, schema, lang), lang)
                .catch(() => Observable.of('ref. not found'));
            }
            return res;
          });

          // all diffs labels
          log._labels = uniq(log.diff.map(diff => diff._label));
          if (log.who.roles)
            log.who.roles = log.who.roles.map(role => Object.assign(role, {
              _label: roles[role.role].label[lang],
            }));
          log.accessMonitorings = log.accessMonitorings.map(value => ({
            value,
            _label: accessMonitorings[value].label[lang],
          }))
          return log;
        });
        return { count, logs };
      });
  }

  key2label(value, base: string[], schema, lang) {
    if (isArray(value)) {
      return value.map(v => this.key2label(v, base, schema, lang));
    }
    if (!isPlainObject(value)) {
      const ref = _get(schema, [...base, 'ref'].join('.'));
      if (ref && !startsWith(value, 'N/A')) {
        return { ref, value };
      }
      const en = _get(schema, [...base, 'enum'].join('.'));
      if (en) {
        return { en, value };
      }
      return value;
    }
    return Object.keys(value).reduce((acc, key) => {
      const label = this.getLabel(schema, [...base, key].join('.'), lang);
      return Object.assign({}, acc, {
        [label]: this.key2label(value[key], [...base, key], schema, lang)
      });
    }, {})
  }

  formatWithRefs(obj, lang) {

    // scalar, leave it like it is
    if (typeof obj === 'string' || typeof obj === 'number') return Observable.of(obj);
    // foreign key => trigger label request
    if (obj.value && obj.ref) return this.getForeignLabel(obj.ref, obj.value).map(x => x[0].value);
    // enum => get label
    if (obj.value && obj.en) return this.getDirectEnumLabel(obj.en, obj.value).map(x => x.label[lang || 'fr']);

    const format = (o, refs, level = 0) => {
      if (isArray(o) && o.length === 0) return '[]';
      if (isArray(o)) {
        return o.some(isPlainObject)
          ? o.map(oo => format(oo, refs, level)).join('\n')
          : o.join(', ');
      }

      // cases of ref enum objects in arrays => direct object by recursion
      // replace ref with label from async call (refs)
      if (o.ref && o.value) return refs[o.value] || '?';
      if (o.en && o.value) return refs[o.en + ':' + o.value] || '?';

      return Object.keys(o)
        .reduce((s, k) => {
          if (isArray(o[k]) && !o[k].length) return s; // bypass empty array #463
          s += `${'  '.repeat(level)}${k} : `;
          if (typeof o[k] === 'string' || typeof o[k] === 'number') s += o[k];
          // replace ref with label from async call (refs)
          else if (o[k].ref && o[k].value) s += o[k].value.length === 0 ? '[]' : (refs[o[k].value] || '?');
          else if (o[k].en && o[k].value) s += (refs[o[k].en + ':' + o[k].value]) || o[k].value;
          else s += format(o[k], refs, level + 1);
          return s + '\n';
        }, '');
    }

    // looking for all refs or enums ({ [ref|en]: xxxx, value: xxx }) objects
    const getRefs = (o) => {
      // array, reccur on content
      if (isArray(o)) return flatten(o.map(getRefs));
      // before diving into objects check if o is not a ref/enum itself
      if (o.ref || o.en) return o;
      return Object.keys(o)
        .reduce((r, k) => {
          // scalar value, skip
          if (typeof o[k] === 'string' || typeof o[k] === 'number') return r;
          // subobject which are not ref or enum, recur on
          if (!o[k].ref && !o[k].en) return [...r, ...getRefs(o[k])];
          // if not scalar neither subObjects is ref or enum add to accumulator
          return [...r, o[k]];
        }, []);
    };

    // identify nested ref or enums
    const refs = getRefs(obj);

    return Observable.combineLatest(
      refs.length
        ? refs.map(({ ref, value, en }) => {
          return ref ? this.getForeignLabel(ref, value) : this.getDirectEnumLabel(en, value).map(item => ({ en, item }));
        })
        : Observable.of([])
    )
      .map(labels => {
        return flatten(labels).reduce((l, v) => {
          if (v.en && !v.item) return l; // nested enums not keep
          if (v.en) return Object.assign(l, { [v.en + ':' + v.item.value]: v.item.label[lang || 'fr'] });
          return Object.assign(l, { [v.id]: v.value });
        }, {})
      }) // { id: value } for all refs founds
      .map(labels => format(obj, labels));

  }

  exportLogs(logs, feature, labs$, translate, details, filetype) {

    const linebreak = filetype === 'xlsx' ? '\n' : '\r\n';

    const exportFile = {
      csv(data) {
        const csvString = Papa.unparse(data);
        const blob = new Blob([csvString], { type: CSV_MIME });
        saveAs(blob, `editlogs.csv`);
      },
      xlsx(data) {
        const opts = { bookType: 'xlsx', bookSST: true, type: 'binary' };
        const workbook = { Sheets: { Sheet1: null }, SheetNames: ['Sheet1'] };
        const sheet = {};
        const range = { s: { c: Infinity, r: Infinity }, e: { c: -Infinity, r: -Infinity } };
        // please can someone do better than that line ?
        data = [Object.keys(data[0]), ...data]
        for (let R = 0, l = data.length; R < l; R++) {
          const line = data[R];
          let C = 0;
          for (const k in line) {
            if (range.s.r > R) range.s.r = R;
            if (range.s.c > C) range.s.c = C;
            if (range.e.r < R) range.e.r = R;
            if (range.e.c < C) range.e.c = C;
            const value = line[k];
            const address = XLSX.utils.encode_cell({ c: C, r: R });
            const cell = { v: value };
            sheet[address] = cell;
            C++;
          }
        }

        sheet['!ref'] = XLSX.utils.encode_range(range);
        workbook.Sheets.Sheet1 = sheet;
        const xlsx = XLSX.write(workbook, opts);
        const buffer = new ArrayBuffer(xlsx.length);
        const view = new Uint8Array(buffer);

        for (let i = 0, l = xlsx.length; i !== l; i++) {
          view[i] = xlsx.charCodeAt(i) & 0xFF;
        }

        const blob = new Blob([buffer], { type: XLSX_MIME });
        saveAs(blob, 'editlogs.xlsx');

      }
    }

    function getRow(log, fea, translations, labs, diff = null, pos = 0, values = []) {
      const res = {
        [translations['editLogs.date']]: (new DatePipe('fr-FR')).transform(log.date, 'yyyy-MM-dd HH:mm'),
        [translations['editLogs.object.' + fea]]: log.item.name,
        [translations['editLogs.action']]: log.action,
        [translations['editLogs.fields']]: log._labels.join(linebreak),
        [translations['editLogs.who']]: log.who.name,
        [translations['editLogs.lab']]: log.who.roles.map(role => role.lab ? labs[role.lab].value : '').join(linebreak),
        [translations['editLogs.role']]: log.who.roles.map(role => role._label).join(linebreak),
      };
      if (!diff) return res;

      return Object.assign(res, {
        [translations['editLogs.action']]: diff.editType,
        [translations['editLogs.fields']]: diff._label,
        [translations['editLogs.before']]: values[pos * 2],
        [translations['editLogs.after']]: values[pos * 2 + 1],

      })
    }

    const translations$ = translate.get([
      'editLogs.date', 'editLogs.who', 'editLogs.action',
      'editLogs.fields', 'editLogs.role', 'editLogs.lab',
      'editLogs.object.' + feature, 'editLogs.before', 'editLogs.after'
    ]);

    if (details) {
      // Je suis navré pour ce qui va suivre

      const logs$ = logs.reduce((acc1, log) => {
        return [
          ...acc1,
          ...log.diff.reduce((acc2, diff) => {
            const before$ = diff._beforeLabelled$ || Observable.of('');
            const after$ = diff._afterLabelled$ || Observable.of('');
            return [...acc2, before$, after$]
          }, [])
        ]
      }, []);

      // RxJS FTW ?!
      Observable.combineLatest([
        (<Observable<any>>Observable.merge(logs$)
          .concatAll())
          .scan((acc, value, i) => [...acc, value], [])
          .take(logs$.length)
          .last(),
        translations$,
        labs$
      ])
        .subscribe(([values, translations, labs]) => {
          exportFile[filetype](logs.reduce((d, log) => [
            ...d,
            ...log.diff.map((diff, j) => getRow(log, feature, translations, labs, diff, d.length + j, values))
          ], []));
        });

    } else {
      Observable.combineLatest([
        translations$,
        labs$
      ])
        .subscribe(([translations, labs]) => {
          exportFile[filetype](logs.map(log => getRow(log, feature, translations, labs)));
        })
    }
  }

  getRelations(feature: string, id: string) {
    if (!id) return Promise.resolve({}); // no id === creation === no relations
    const url = `${this.dataUrl}/${feature}/${id}/relations`;
    return this.http.get(url, this.getHttpOptions())
      .toPromise()
      .then(response => response.json())
      .catch(this.handleError);
  }

  removeData(feature: string, id: string) {
    const url = `${this.dataUrl}/${feature}/${id}`;
    return this.http.delete(url, this.getHttpOptions())
      .toPromise()
      .then(response => response.json())
      .catch(this.handleError);
  }

  getLayout(feature: string) {
    // check for cached results
    if (this.layoutsCache[feature]) {
      return this.layoutsCache[feature].toPromise();
    }

    const url = `${this.layoutUrl}/${singular[feature]}`;
    let $layout = this.http.get(url, this.getHttpOptions())
      .map(response => response.json());
    this.layoutsCache[feature] = $layout.publishReplay(1).refCount();
    return $layout.toPromise();
  }

  getColumnsInfo(feature: string) {
    if (this.columnsCache) {
      return Observable.of(this.columnsCache[feature]).toPromise();
    }
    return this.http.get(this.columnsUrl)
      .toPromise()
      .then(response => response.json())
      .then(columns => {
        this.columnsCache = columns;
        return columns[feature];
      })
      .catch(this.handleError);
  }

  getColumnsWithDefault(feature: string) {
    return Promise.all([
      this.getColumns(feature),
      this.getDefaultColumns(feature)
    ]).then(([cols, default_cols]) => default_cols.map(default_col => cols.find(col => col.key === default_col)));
  }

  getDefaultColumns(feature: string) {
    return this.getColumnsInfo(feature).then(info => info['defaults']);
  }

  getSchema(feature: string, path?: string) {
    if (!this.schemasCache[feature]) {
      const url = `${this.schemaUrl}/${singular[feature]}`;
      this.schemasCache[feature] = this.http.get(url, this.getHttpOptions())
        .distinctUntilChanged()
        .toPromise()
        .then(response => response.json())
        .then(schema => {
          // Server always adds 'type = object' on root description, we don't want to bother with that here
          delete schema.type;
          return schema;
        });
    }
    if (path) {
      // We remove every ".0", ".1", etc… in path, as they refer to multiple fields
      // Note: we may add some checks here, worst case = return null, which is an expected possibility
      return this.schemasCache[feature].then(get(path.replace(/\.\d+(?:\.|$)/, '')));
    } else {
      return this.schemasCache[feature];
    }
  }

  getColumns(feature: string) {
    return Promise.all([
      this.getSchema(feature),
      this.getColumnsInfo(feature)
    ]).then(([schema, info]) => {
      const removedColumns = info['selector']
        .filter(col => typeof col === 'string' && col[0] === '-')
        .map(col => col.substring(1));
      const reals = Object.keys(schema)
        .filter(key => removedColumns.indexOf(key) === -1)
        .map(key => ({ key, label: schema[key].label }));
      const virtuals = info['selector']
        .filter(col => typeof col === 'object' && col.key && col.label);
      return reals.concat(virtuals);
    });
  }

  createExportDownloadLink(type, name, query) {
    const options = new URLSearchParams();

    for (const k in query) {
      options.set(k, query[k]);
    }

    const url = `${this.exportUrl}/${type}/${name}?${options}`;

    return url;
  }

  filterEnumValues(enumValues, term, lang) {
    return term
      ? sortByDistance(term, enumValues, e => e.label[lang] || e.label['fr']) // TODO make default lang configurable?
      : enumValues;
  }

  srcEnumBuilder(src: string, materializedPath: string, lang: string) {
    const enum$ = this.getEnum(src);
    return function (terms$: Observable<string>, max, form: FormGroup) {

      const nestedField = this.getFieldForPath(src, form, materializedPath);

      return terms$
        .startWith('')
        .distinctUntilChanged()
        .combineLatest(enum$, nestedField ? nestedField.valueChanges : Observable.of(null))
        .map(([term, enumValues, reset]: [string, Array<any>, string | null]) => {
          enumValues = reset ? enumValues[reset] : this.nestedEnum(src, enumValues, form, materializedPath);
          reset = reset && materializedPath;
          const values = this.filterEnumValues(enumValues, term, lang);
          return { values, reset };
        });

    }.bind(this);
  }

  getEnumLabel(src: string, materializedPath: string, form: FormGroup, values: string | string[]) {

    if (!(values instanceof Array)) {
      values = [values];
    }
    return this.getEnum(src)
      .map(enumValues => {
        enumValues = this.nestedEnum(src, enumValues, form, materializedPath);

        return (<string[]>values).map(v => {
          return enumValues.find(entry => entry.value === v);
        }).filter(v => !!v);
      });
  }

  getDirectEnumLabel(src: string, value: string) {

    return this.getEnum(src)
      .map(enumValues => {
        if (!isArray(enumValues)) enumValues = flatten(values(enumValues)); // for nested : brut forced
        return enumValues.find(entry => entry.value === value) || null;
      });
  }

  srcForeignBuilder(src: string, path?: string, feature?: string) {
    return (terms$: Observable<string>, max) =>
      terms$
        .startWith('')
        .debounceTime(400) // pass as parameter ?
        .distinctUntilChanged()
        .switchMap(term => this.rawSearch(src, term, path, feature));
  }

  // @TODO handle multiple values (array of ids)
  getForeignLabel(feature: string, values: string | string[]) {
    if (!(values instanceof Array)) {
      values = [values];
    }
    values = values.filter(v => !!v);

    if (values.length === 0) {
      return Observable.of([]);
    }

    const api = mongoSchema2Api[feature] || feature;
    const ids = (<string[]>((this.tempForeignKeys[api] && intersection(this.tempForeignKeys[api], values).length)
      ? this.tempForeignKeys[api]
      : (<string[]>values))).join(',');
    const url = `${this.dataUrl}/${api}/${ids}/string`;

    if (!this.labelsCache[url]) {
      this.labelsCache[url] = this.http.get(url, this.getHttpOptions())
        .map(response => response.json())
        .share();
    }

    return this.labelsCache[url].map(allvalues => {
      return allvalues.filter(v => (<string[]>values).indexOf(v.id) !== -1);
    });
  }

  getForeignCreate(feature) {
    return function (name: string) {
      const url = `${this.dataUrl}/${mongoSchema2Api[feature]}`;
      return this.http.post(url, { name }, this.getHttpOptions())
        .map(response => response.json());
    }.bind(this);
  }

  rawSearch(feature: string, query: string, path?: string, rootFeature?: string) {
    if (!query) return Observable.of({ reset: false, values: [] });
    const url = `${this.dataUrl}/${mongoSchema2Api[feature] || feature}/search`;
    // return this.http.get(url, this.getHttpOptions({ q: deburr(query) || '*', path, rootFeature }))
    return this.http.get(url, this.getHttpOptions({ q: query || '*', path, rootFeature }))
      .map(response => response.json())
      .map(items => ({
        reset: false,
        values: items.map(item => ({ id: item.value, value: item.label }))
      }));
  }

  resetTemForeignKeys() {
    this.tempForeignKeys = {};
  }

  buildForm(layout, data, base = false): FormGroup {
    let form = this.fb.group({});
    let fields = layout.reduce((acc, cv) => [...acc, ...cv.fields], []);

    // reset tempForeignKeys
    if (base) {
      this.resetTemForeignKeys();
    }

    // build form from object after layout manipluation
    if (fields[0] instanceof Array) {
      fields = fields.map(f => ({ fields: f }));
    }

    // normalize [[a, b ], c] -> [a, b, c]
    fields = fields.reduce((acc, c) => [...acc, ...(c.fields ? c.fields : [c])], []);
    fields.forEach(field => {
      const hasData = data[field.name] !== null && data[field.name] !== undefined;
      const fieldData = hasData ? data[field.name] : field.multiple ? [] : field.type === 'object' ? {} : '';
      if (field.multiple && field.type === 'object') {
        let fa = new FormArray([]);
        // add '.x' for multiple fields (for matching fieldName.*)
        if (this.disabled(data.opts, field.name + '.x')) {
          fa.disable();
        }
        fieldData.forEach((d, i) => {
          this.storeForeignKeys(field.ref, d);
          let subdata = Object.assign({}, d || {}, {
            opts: Object.assign({}, data.opts, {
              path: [...data.opts.path, field.name, i]
            })
          });
          this.addFormControlToArray(fa, field, subdata);
        });
        form.addControl(field.name, fa);
      } else if (field.type === 'object') {
        this.storeForeignKeys(field.ref, fieldData);
        let subdata = Object.assign({}, fieldData, {
          opts: Object.assign({}, data.opts, {
            path: [...data.opts.path, field.name]
          })
        });
        form.addControl(field.name, this.buildForm(field.layout, subdata));
      } else {
        this.storeForeignKeys(field.ref, fieldData);
        form.addControl(field.name, new FormControl({
          value: fieldData,
          // add '.x' for multiple fields (for matching fieldName.*)
          disabled: this.disabled(data.opts, field.name + (field.multiple ? '.x' : ''))
        }, this.getValidators(field)));
      }
    });
    return form;
  }

  private storeForeignKeys(feature, value) {
    if (!feature) return;
    if (!value) return;
    const api = mongoSchema2Api[feature];
    value = isArray(value) ? value : [value];
    this.tempForeignKeys[api] = uniq([...(this.tempForeignKeys[api] || []), ...value]);
  }

  private disabled(opts, fieldName) {
    // 1. test globale (editable)
    if (!opts.editable) {
      return true;
    }

    // 2. test restrictedFields
    const path = [...opts.path, fieldName].join('.');
    const regexps = opts.restrictedFields.map(pattern => new RegExp(pattern.replace('.', '\\.').replace('*', '.*')));
    return regexps.reduce((acc, r) => {
      return acc || r.test(path);
    }, false);
  }

  addFormControlToArray(fa: FormArray, field, data) {
    fa.push(this.buildForm(field.layout, data));
  }

  getEmptyDataWith(field: any, feature: string, path: string | undefined = undefined) {
    return this.getSchema(feature, path).then(schema => {
      return this.userService.getRestrictedFields()
        .map(restrictedFields => {
          let fieldClone = Object.assign({}, field || {});
          delete fieldClone.multiple;
          const data = this.buildData(fieldClone, schema);
          data.opts = {
            editable: true,
            restrictedFields: restrictedFields[feature],
            path: path ? path.split('.') : ''
          };
          return data;
        })
        .toPromise();
    });
  }

  // recursively construct empty data following types
  private buildData(field, schema: Object | undefined) {
    if (field.type === 'object') {
      let data = field.layout
        .reduce((acc, row) => [...acc, ...row.fields], [])
        .reduce((acc, f) => Object.assign(acc, {
          [f.name]: this.buildData(f, schema && schema[f.name])
        }), {});
      if (field.multiple) {
        return [data];
      } else {
        return data;
      }
    } else {
      if (field.multiple) {
        return [];
      } else {
        const def = schema && schema['default'];
        return def === undefined ? null : def;
      }
    }
  }

  closeAll(layout) {
    return layout.map(group => {
      if (group.collapsabled) {
        group.collapsed = true; // by default all collapsable groups are closed
      }
      return group;
    });
  }

  translate(layout, lang) {
    return layout.map(group => {
      let grp = Object.assign({}, group, {
        label: group.label ? group.label[lang] : '',
        description: group.description ? group.description[lang] : ''
      });
      if (grp.fields) {
        grp.fields = this.translate(grp.fields, lang);
      }
      if (grp.layout) {
        grp.layout = this.translate(grp.layout, lang);
      }
      return grp;
    });
  }

  getControlType(field): string {
    if (field.enum || field.softenum || field.ref) {
      return 'select';
    }
    if (field.type) {
      return field.type;
    }
    return 'input';
  }


  save(feature: string, data: any) {
    let options = this.getHttpOptions();
    let query: Observable<any>;
    if (data.id) {
      const url = `${this.dataUrl}/${feature}/${data.id}`;
      query = this.http.put(url, data, options);
    } else {
      const url = `${this.dataUrl}/${feature}`;
      query = this.http.post(url, data, options);
    }
    return query.toPromise()
      .then(response => response.json())
      .catch(this.handleError);
  }

  getSchemaApi(feature) {
    return mongoSchema2Api[feature];
  }

  rows(layout) {
    let total = 0;
    return layout
      .map(group => {
        group.fields = group.fields.map(field => {
          total += field.fields ? field.fields.length : 1;
          return (field.fields || [field]).map(f => {
            if (f.type === 'object') {
              f.layout = this.rows(f.layout);
            }
            return f;
          });
        });
        return group;
      })
      .map(group => {
        group.fields = group.fields.map(field => {
          field.colspan = total / field.length;
          return field;
        });
        return group;
      });
  }

  clearCache() {
    this.enumsCache = {};
    this.layoutsCache = {};
    this.schemasCache = {};
    this.columnsCache = null;
  }

  singular(feature) {
    return singular[feature];
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

  private getValidators(field): ValidatorFn | ValidatorFn[] | null {
    if (field && field.requirement && field.requirement === 'mandatory') {
      return [Validators.required];
    }
    return null;
  }

  private normalize(str: string): string {
    return str.normalize('NFKD').replace(/[\u0300-\u036F]/g, '');
  }

  private normalizePath(path) {
    let BLANK = '';
    let SLASH = '/';
    let DOT = '.';
    let DOTS = DOT.concat(DOT);
    let SCHEME = '://';

    if (!path || path === SLASH) {
      return SLASH;
    }

    let prependSlash = (path.charAt(0) === SLASH || path.charAt(0) === DOT);
    let target = [];
    let src, scheme, parts, token;

    if (path.indexOf(SCHEME) > 0) {
      parts = path.split(SCHEME);
      scheme = parts[0];
      src = parts[1].split(SLASH);
    } else {
      src = path.split(SLASH);
    }

    for (let i = 0; i < src.length; ++i) {
      token = src[i];
      if (token === DOTS) {
        target.pop();
      } else if (token !== BLANK && token !== DOT) {
        target.push(token);
      }
    }

    let result = target.join(SLASH).replace(/[\/]{2,}/g, SLASH);

    return (scheme ? scheme + SCHEME : '') + (prependSlash ? SLASH : BLANK) + result;
  }

  buildEnumCache() {
    return this.http.get(this.enumUrl)
      .map(response => response.json())
      .do(enums => {
        Object.keys(enums).forEach(key => {
          let data = enums[key];
          if (key === 'nationalities') {
            data = enums[key].filter(item => {
              return !!item.label.fr || item.label.fr !== '';
            });
          }
          this.storageService.save(data, key, 'enums');
        });
      });
  }

  getEnum(src: string) {

    // nested
    const nestedPos = src.indexOf(':');
    if (nestedPos !== -1) {
      src = `nested/${src.substr(0, nestedPos)}`;
    }

    const storedEnum = this.storageService.get(src, 'enums');
    if (storedEnum) {
      return Observable.of(storedEnum);
    }

    // check for cached results
    if (this.enumsCache[src]) {
      return this.enumsCache[src];
    }

    const url = `${this.enumUrl}/${src}`;
    let $enum = this.http.get(url)
      .map(response => {
        let json = response.json();

        // NOTE: this is a dirty special case for nationalities.
        // Might be generic one day...
        if (src === 'nationalities') {

          json = json.filter(item => {
            return !!item.label.fr || item.label.fr !== '';
          });
        }
        return json;
      })
      .share();

    this.enumsCache[src] = $enum;
    return $enum;
  }

  private nestedEnum(src, enumValues, form, materializedPath) {
    const path = this.computePath(src, materializedPath);
    if (!path) {
      return enumValues;
    }
    const key = path.reduce((acc, cv) => acc[cv], form.root.value);
    return key ? enumValues[key] : [];
  }

  private getFieldForPath(src, form, materializedPath) {
    const path = this.computePath(src, materializedPath);
    if (!path) {
      return false;
    }

    return path.reduce((acc, cv) => {
      return acc.get(cv);
    }, form.root);
  }

  private computePath(src, materializedPath): null | string[] {
    const posNested = src.indexOf(':');

    // not nested enum
    if (posNested === -1) {
      return null;
    }

    return this
      .normalizePath(`${materializedPath.replace(/\./g, '/')}/${src.substr(posNested + 1)}`)
      .split('/');
  }

}
