import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { UserService } from './user.service';

import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class LoggedInGuard implements CanActivate {
  constructor(private user: UserService, private router: Router) { }

  canActivate() {
    return this.user.isLoggedIn()
      .pipe(
        map(loggedIn => {
          if (loggedIn) {
            return true;
          }
          this.router.navigate(['/login']);
          return false;
        }),
        catchError(() => {
          this.router.navigate(['/login']);
          return of(false);
        })
      );
  }
}
