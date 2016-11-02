import { Injectable } from '@angular/core';
import { Http, RequestOptions } from '@angular/http';

import { environment } from '../environments/environment';

@Injectable()
export class UserService {

  private loggedIn = false;
  private loginUrl = `${environment.API_BASE_URL}/auth/login`;
  private checkUrl = `${environment.API_BASE_URL}/auth/myself`;
  private httpOptions: RequestOptions;

  constructor(private http: Http) {
    this.httpOptions = new RequestOptions({
      withCredentials: true
    });
  }

  login(username, password) {

    return this.http
      .post(this.loginUrl, { login: username, password }, this.httpOptions)
      .map(res => res.json())
      .map(res => {
        this.loggedIn = true;
      });
  }

  // logout() {
  //   localStorage.removeItem('auth_token');
  //   this.loggedIn = false;
  // }

  isLoggedIn() {
    return this.http.get(this.checkUrl, this.httpOptions)
      .map(response => response.json).cache();
  }
}
