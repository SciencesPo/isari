import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class IsariDataService {

  private dataUrl = 'api/people';
  private schemaUrl = 'api/schemas';
  private layoutUrl = 'api/layouts';

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

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

}


