import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { FormGroup, FormControl, FormArray, FormBuilder, Validators, ValidatorFn } from '@angular/forms';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/switchMap';

@Injectable()
export class IsariDataService {

  private dataUrl = 'http://localhost:8080';
  private layoutUrl = 'http://localhost:8080/layouts';
  private enumUrl = 'http://localhost:8080/enums';
  private schemaUrl = 'http://localhost:8080/schemas';

  // private dataUrl = 'api';
  // private layoutUrl = 'api/layouts';
  // private enumUrl = 'api/enums';
  // private schemaUrl = 'api/schemas';

  constructor(private http: Http, private fb: FormBuilder) { }

  getPeople(id: string) {
    const url = `${this.dataUrl}/people/${id}`;
    return this.http.get(url)
      .toPromise()
      // .then(response => response.json().data)
      .then(response => response.json())
      .catch(this.handleError);
  }

  getData(feature: string, id: string) {
    return this['get' + feature.charAt(0).toUpperCase() + feature.slice(1).toLowerCase()](id);
  }

  getLayout(feature: string) {
    const url = `${this.layoutUrl}/${feature}`;
    return this.http.get(url)
      .toPromise()
      // .then(response => response.json().data.layout)
      .then(response => response.json())
      .catch(this.handleError);
  }

  getColumns(feature: string) {
    const url = `${this.schemaUrl}/${feature}`;
    return this.http.get(url)
      .toPromise()
      // .then(response => response.json().data.schema)
      .then(response => response.json())
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

  getEnumLabel(src: string, value: string | string[], lang: string) {
    return this.getEnum(src)
      .map(values => {
        if (value instanceof Array) {
          return value.map(v => {
            return values.find(entry => entry.value === v);
          }).filter(v => !!v);
        } else {
          const found = values.find(entry => entry.value === value);
          return found ? found.label[lang] : '';
        }
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

  getForeignLabel(src: string, value: string) {
    return Observable.of('John');
  }

  rawSearch(feature: string, query: string) {
    const url = `${this.dataUrl}/${feature}`;
    // @TODO complete with var search = new URLSearchParams() && search.set('query', query);
    return this.http.get(url)
      .map(response => response.json().data)
      .map(items => items.map(item => ({ id: item.id, stringValue: item.name }))); // useless with api server
      // .map(response => response.json())
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
        label: group.label[lang]
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
    // if (en === 'KEYS(personalActivityTypes)' || en === 'personalActivityTypes.$personalActivityType') {
    //   return Promise.resolve([]);
    // }
    const url = `${this.enumUrl}/${src}`;
    return this.http.get(url)
      .map(response => response.json());
  }

}


