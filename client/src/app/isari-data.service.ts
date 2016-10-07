import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { IsariInputComponent } from './fields/isari-input/isari-input.component';
import { IsariSelectComponent } from './fields/isari-select/isari-select.component';
import { IsariDateComponent } from './fields/isari-date/isari-date.component';
import { DataEditorComponent } from './data-editor/data-editor.component';

@Injectable()
export class IsariDataService {

  private dataUrl = 'api/people';
  private schemaUrl = 'api/schemas';
  private layoutUrl = 'api/layouts';
  private enumUrl = 'api/enums';

  constructor(private http: Http) { }

  getPeople (id: number) {
    const url = `${this.dataUrl}/${id}`;
    return this.http.get(url)
      .toPromise()
      .then(response => response.json().data)
      .catch(this.handleError);
  }

  getSchema (feature: string) {
    const url = `${this.schemaUrl}/${feature}`;
    return this.http.get(url)
      .toPromise()
      .then(response => response.json().data.schema || response.json().data)
      .catch(this.handleError);
  }

  getLayout (feature: string) {
    const url = `${this.layoutUrl}/${feature}`;
    return this.http.get(url)
      .toPromise()
      .then(response => response.json().data.layout || response.json().data)
      .catch(this.handleError);
  }

  getEnum (en: string) {
    const url = `${this.enumUrl}/${en}`;
    return this.http.get(url)
      .toPromise()
      .then(response => response.json().data.enum || response.json().data)
      .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

  getInputComponent (field): any {
    // if (field.enum) {
    //   return IsariSelectComponent;
    // }
    if (field.type === 'object') {
      return DataEditorComponent;
    }
    if (field.type === 'date') {
      return IsariDateComponent;
    }
    return IsariInputComponent;
  }

}


