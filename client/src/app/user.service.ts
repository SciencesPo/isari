import { Injectable } from '@angular/core';
import { Http, RequestOptions } from '@angular/http';

import { environment } from '../environments/environment';

@Injectable()
export class UserService {

  private loggedIn = false;
  private loginUrl = `${environment.API_BASE_URL}/auth/login`;

  constructor(private http: Http) {
  }

  login(username, password) {

    let options = new RequestOptions({
      withCredentials: true
    });

    return this.http
      .post(this.loginUrl, { login: username, password }, options)
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
    return this.loggedIn;
  }
}
