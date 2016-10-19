import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { FormGroup, FormControl, FormArray, FormBuilder, Validators, ValidatorFn } from '@angular/forms';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class IsariDataService {

  // private dataUrl = 'http://localhost:8080/people';
  // private layoutUrl = 'http://localhost:8080/layouts';
  // private enumUrl = 'http://localhost:8080/enums';

  private dataUrl = 'api/people';
  private layoutUrl = 'api/layouts';
  private enumUrl = 'api/enums';

  constructor(private http: Http, private fb: FormBuilder) { }

  getPeople (id: string) {
    const url = `${this.dataUrl}/${id}`;
    return this.http.get(url)
      .toPromise()
      .then(response => response.json().data)
      // .then(response => response.json())
      .catch(this.handleError);
  }

  getData (feature: string, id: string) {
    return this['get' + feature.charAt(0).toUpperCase() + feature.slice(1).toLowerCase()](id);
  }

  getLayout (feature: string) {
    const url = `${this.layoutUrl}/${feature}`;
    return this.http.get(url)
      .toPromise()
      .then(response => response.json().data.layout)
      // .then(response => response.json())
      .catch(this.handleError);
  }

  getEnum (en: string) {
    // cas non gérés pour le moment
    if (en === 'KEYS(personalActivityTypes)' || en === 'personalActivityTypes.$personalActivityType') {
      return Promise.resolve([]);
    }
    const url = `${this.enumUrl}/${en}`;
    return this.http.get(url)
      .toPromise()
      .then(response => response.json().data.enum)
      // .then(response => response.json())
      .catch(this.handleError);
  }

  buildForm(layout, data): FormGroup {
    let form = this.fb.group({});
    let fields = layout.reduce((acc, cv) => [...acc, ...cv.fields], []);
    fields.forEach(field => {
      if (field.multiple) {
        let fa = new FormArray([]);
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
    if (field.type === 'object') {
      fa.push(this.buildForm(field.layout, data));
    } else {
      fa.push(new FormGroup({
        [field.name]: new FormControl({
          value: data || '',
          disabled: false
        })
      }));
    }
  }

  getControlType (field): string {
    return field.type || (field.enum ? 'select' : null) || 'input';
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

  // private setGroupLabels (layout) {
  //   return layout.map(group => Object.assign({}, group, {
  //     label: this.getLabel(group)
  //   }));
  // }

  // private getLabel (item) {
  //   return item.label
  //     || item.fields
  //         .map(field => this.getLabel(field))
  //         .reduce((acc, cv) => {
  //           Object.keys(cv).forEach(key => {
  //             acc[key] = [...(acc[key] || []), cv[key]];
  //           });
  //           return acc;
  //         }, {});
  // }

}


