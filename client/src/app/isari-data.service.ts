import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { IsariInputComponent } from './fields/isari-input/isari-input.component';
import { IsariSelectComponent } from './fields/isari-select/isari-select.component';
import { IsariDateComponent } from './fields/isari-date/isari-date.component';
import { DataEditorComponent } from './data-editor/data-editor.component';

@Injectable()
export class IsariDataService {

  // private dataUrl = 'api/people';
  // private layoutUrl = 'api/layouts';
  // private enumUrl = 'api/enums';

  private dataUrl = 'http://localhost:8080/people';
  private layoutUrl = 'http://localhost:8080/layouts';
  private enumUrl = 'http://localhost:8080/enums';

  constructor(private http: Http) { }

  getPeople (id: string) {
    const url = `${this.dataUrl}/${id}`;
    return this.http.get(url)
      .toPromise()
      .then(response => response.json())
      .catch(this.handleError);
  }

  getData (feature: string, id: string) {
    return this['get' + feature.charAt(0).toUpperCase() + feature.slice(1).toLowerCase()](id);
  }

  getLayout (feature: string) {
    const url = `${this.layoutUrl}/${feature}`;
    return this.http.get(url)
      .toPromise()
      .then(response => response.json())
      .catch(this.handleError);
  }

  getEnum (en: string) {
    if (en === 'KEYS(personalActivityTypes)' || en === 'personalActivityTypes.$personalActivityType') {
      return Promise.resolve([]);
    }
    const url = `${this.enumUrl}/${en}`;
    return this.http.get(url)
      .toPromise()
      .then(response => response.json())
      .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

  getInputComponent (field): any {
    if (field.enum) {
      return IsariSelectComponent;
    }
    if (field.type === 'object') {
      return DataEditorComponent;
    }
    if (field.type === 'date') {
      return IsariDateComponent;
    }
    return IsariInputComponent;
  }

}


