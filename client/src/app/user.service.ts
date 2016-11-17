import { Injectable } from '@angular/core';
import { Http, RequestOptions } from '@angular/http';
import { environment } from '../environments/environment';
import 'rxjs/add/operator/publishReplay';

@Injectable()
export class UserService {

  private loggedIn = false;
  private loginUrl = `${environment.API_BASE_URL}/auth/login`;
  private logoutUrl = `${environment.API_BASE_URL}/auth/logout`;
  private checkUrl = `${environment.API_BASE_URL}/auth/myself`;
  private permissionsUrl = `${environment.API_BASE_URL}/auth/permissions`;
  private httpOptions: RequestOptions;
  private organizations: any;

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

  logout() {
    return this.http
      .post(this.logoutUrl, null, this.httpOptions)
      .map(res => {
        this.loggedIn = false;
      });
  }

  isLoggedIn() {
    return this.http.get(this.checkUrl, this.httpOptions)
      .map(response => response.json).cache();
  }

  getOrganizations() {
    if (!this.organizations) {
      this.organizations = this.http
        .get(this.permissionsUrl, this.httpOptions)
        .map(res => res.json())
        .publishReplay(1)
        .refCount();
    }
    return this.organizations;
  }

  getOrganization (id: string | undefined) {
    return this.getOrganizations()
      .map(({organizations}) => organizations.find(organization => organization.id === id));
  }

}
