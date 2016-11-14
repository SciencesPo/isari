import { Injectable } from '@angular/core';
import { Http, URLSearchParams, RequestOptions } from '@angular/http';
import { FormGroup, FormControl, FormArray, FormBuilder, Validators, ValidatorFn } from '@angular/forms';

import { environment } from '../environments/environment';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/cache';

const mongoSchema2Api = {
  'Organization': 'organizations',
  'People': 'people',
  'Activities': 'activities'
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
  private columnsCache = null;

  private dataUrl = `${environment.API_BASE_URL}`;
  private layoutUrl = `${environment.API_BASE_URL}/layouts`;
  private enumUrl = `${environment.API_BASE_URL}/enums`;
  private schemaUrl = `${environment.API_BASE_URL}/schemas`;
  private columnsUrl = `${environment.API_BASE_URL}/columns`;

  constructor(private http: Http, private fb: FormBuilder) {}

  getData(feature: string, id: string) {
    const url = `${this.dataUrl}/${feature}/${id}`;
    let options = new RequestOptions({ withCredentials: true });
    return this.http.get(url, options)
      .toPromise()
      .then(response => response.json())
      .catch(this.handleError);
  }

  getDatas(feature: string, { fields, applyTemplates }: { fields: string[], applyTemplates: boolean }) {
    const url = `${this.dataUrl}/${feature}`;
    const search = new URLSearchParams();
    fields.push('id'); // force id
    search.set('fields', fields.join(','));
    search.set('applyTemplates', (applyTemplates ? 1 : 0).toString());

    let options = new RequestOptions({
      withCredentials: true,
      search
    });

    return this.http.get(url, options)
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
    let $layout = this.http.get(url).map(response => response.json());
    this.layoutsCache[feature] = $layout.cache();
    return $layout.toPromise();
  }

  getColumnsWithDefault(feature: string) {
    return Promise.all([
      this.getColumns(feature),
      this.getDefaultColumns(feature)
    ]).then(([cols, default_cols]) => default_cols.map(default_col => cols.find(col => col.key === default_col)));
  }

  getDefaultColumns(feature: string) {
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

  getColumns(feature: string) {
    const url = `${this.schemaUrl}/${singular[feature]}`;
    return this.http.get(url)
      .distinctUntilChanged()
      .toPromise()
      .then(response => response.json())
      .then(schema => {
        delete schema.type;
        return schema;
      })
      .then(schema => Object.keys(schema).map(key => ({
        key,
        label: schema[key].label
      })));
  }

  srcEnumBuilder(src: string) {
    const enum$ = this.getEnum(src);
    return function(terms$: Observable<string>, max) {
      return terms$
        .startWith('')
        .distinctUntilChanged()
        .combineLatest(enum$)
        .map(([term, values]) => {
          term = this.normalize(term.toLowerCase());
          return (term
            ? values.filter(entry => this.normalize(entry.label.fr.toLowerCase()).indexOf(term) !== -1)
            : values)
            .slice(0, max);
        });
    }.bind(this);
  }

  getEnumLabel(src: string, values: string | string[], lang: string) {
    if (!(values instanceof Array)) {
      values = [values];
    }
    return this.getEnum(src)
      .map(enumValues => {
        return (<string[]>values).map(v => {
          return enumValues.find(entry => entry.value === v);
        }).filter(v => !!v);
      });
  }

  srcForeignBuilder(src: string) {
    return function(terms$: Observable<string>, max) {
      return terms$
        .startWith('')
        .debounceTime(400) // pass as parameter ?
        .distinctUntilChanged()
        .switchMap(term => this.rawSearch(src, term));
    }.bind(this);
  }

  // @TODO handle multiple values (array of ids)
  getForeignLabel(feature: string, values: string | string[]) {
    if (!(values instanceof Array)) {
      values = [values];
    }
    if (values.length === 0) {
      return Observable.of([]);
    }
    const url = `${this.dataUrl}/${mongoSchema2Api[feature]}/${values.join(',')}/string`;
    let options = new RequestOptions({ withCredentials: true });
    return this.http.get(url, options)
      .map(response => response.json())
      // .map(item => item.value);
  }

  rawSearch(feature: string, query: string) {
    const url = `${this.dataUrl}/${mongoSchema2Api[feature]}/search`;
    const search = new URLSearchParams();
    search.set('q', query || '*');
    // search.set('fields', 'name');
    let options = new RequestOptions({ withCredentials: true, search });
    return this.http.get(url, options)
      .map(response => response.json())
      .map(items => items.map(item => ({ id: item.value, value: item.label })));
  }

  buildForm(layout, data): FormGroup {
    let form = this.fb.group({});
    let fields = layout.reduce((acc, cv) => [...acc, ...cv.fields], []);
    fields.forEach(field => {
      if (field.multiple && field.type === 'object') {
        let fa = new FormArray([]);
        // fa.disable(disabled);
        (data[field.name] || []).forEach(d => {
          this.addFormControlToArray(fa, field, d);
        });
        form.addControl(field.name, fa);
      } else if (field.type === 'object') {
        form.addControl(field.name, this.buildForm(field.layout, data[field.name] || {}));
      } else {
        form.addControl(field.name, new FormControl({
          value: data[field.name] || '',
          disabled: false
        }, this.getValidators(field)));
      }
    });
    return form;
  }

  addFormControlToArray(fa: FormArray, field, data = {}) {
    let fieldClone = Object.assign({}, field);
    delete fieldClone.multiple;
    fa.push(this.buildForm(field.layout, data));
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
    return  'input';
  }


  save(feature: string, data: any) {
    const url = `${this.dataUrl}/${feature}/${data.id}`;
    let options = new RequestOptions({ withCredentials: true });
    return this.http.put(url, data, options)
      .toPromise()
      .then(response => response.json())
      .catch(this.handleError);
  }

  // getErrors(form: FormGroup) {
  //   return this.getErrorsFromControls(form.controls);
  // }

  // getErrorsFromControls(controls: { [key: string]: AbstractControl}) {
  //   let errors = [];
  //   for (let fieldName of Object.keys(controls)){
  //     let control = controls[fieldName];
  //     if (control instanceof FormGroup) {
  //       errors = [...errors, ...this.getErrorsFromControls(control.controls)];
  //       this.getErrorsFromControls(control.controls);
  //     }
  //     if (control instanceof FormArray) {
  //       control.controls
  //         .filter(ctrl => ctrl.invalid)
  //         .forEach(ctrl => {
  //           errors = [...errors, ...this.getErrorsFromControls( (<FormGroup>ctrl).controls)];
  //         });
  //     }
  //     if (control.errors) {
  //       errors.push(fieldName);
  //     }
  //   }
  //   return errors;
  // }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

  private getValidators (field): ValidatorFn|ValidatorFn[]|null {
    if (field && field.requirement && field.requirement === 'mandatory') {
      return [Validators.required];
    }
    return null;
  }

  private normalize(str: string): string {
    return str.normalize('NFKD').replace(/[\u0300-\u036F]/g, '')
  }

  private getEnum(src: string) {
    // // cas non gérés pour le moment
    if (src === 'KEYS(personalActivityTypes)' || src === 'personalActivityTypes.$personalActivityType') {
      return Observable.of([]);
    }

    // check for cached results
    if (this.enumsCache[src]) {
      return this.enumsCache[src];
    }

    const url = `${this.enumUrl}/${src}`;
    let $enum = this.http.get(url).map(response => response.json());
    this.enumsCache[src] = $enum.cache();
    return $enum;
  }

}


