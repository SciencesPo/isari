import { Observable, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { Http, RequestOptions } from '@angular/http';
import { environment } from '../environments/environment';
import { map, share, catchError } from 'rxjs/operators';

@Injectable()
export class UserService {

  private loggedIn = false;
  private loginUrl = `${environment.API_BASE_URL}/auth/login`;
  private logoutUrl = `${environment.API_BASE_URL}/auth/logout`;
  private checkUrl = `${environment.API_BASE_URL}/auth/myself`;
  private permissionsUrl = `${environment.API_BASE_URL}/auth/permissions`;
  private httpOptions: RequestOptions;
  public organizations: any;
  private currentOrganizationId;

  constructor(private http: Http) {
    this.httpOptions = new RequestOptions({
      withCredentials: true
    });
  }

  login(username, password): Observable<any> {
    return this.http
      .post(this.loginUrl, { login: username, password }, this.httpOptions)
      .pipe(
        map(res => res.json()),
        map(res => this.loggedIn = true)
      );
  }

  logout(): Observable<any> {
    return this.http
      .post(this.logoutUrl, null, this.httpOptions)
      .pipe(
        map(res => {
          this.organizations = null;
          this.loggedIn = false;
        })
      );
  }

  isLoggedIn(): Observable<any> {
    return this.http.get(this.checkUrl, this.httpOptions)
      .pipe(
        map(response => response.json()),
        share(),
        catchError(err => throwError(err))
      );
  }

  getOrganizations(): Observable<any> {
    if (!this.organizations) {
      this.organizations = this.http
        .get(this.permissionsUrl, this.httpOptions)
        .pipe(
          map(res => res.json()),
          share()
        )
    }
    return this.organizations;
  }

  getOrganization(id: string | undefined): Observable<any> {
    return this.getOrganizations()
      .pipe(
        map(({ organizations }) => organizations.find(organization => organization.id === id))
      );
  }

  setCurrentOrganizationId(id: string) {
    this.currentOrganizationId = id;
  }

  getCurrentOrganizationId() {
    return this.currentOrganizationId;
  }

  getRestrictedFields(): Observable<any> {
    return this.getOrganization(this.currentOrganizationId)
      .pipe(
        map(organization => organization.restrictedFields)
      );
  }

}
