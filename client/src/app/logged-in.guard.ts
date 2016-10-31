import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { UserService } from './user.service';

import { Observable } from 'rxjs/Observable';

@Injectable()
export class LoggedInGuard implements CanActivate {
  constructor(private user: UserService, private router: Router) {}

  canActivate() {
    return this.user.isLoggedIn()
      .map(loggedIn => {
        if (loggedIn) {
          return true;
        }
        this.router.navigate(['/login']);
        return false;
      })
      .catch(() => {
        this.router.navigate(['/login']);
        return Observable.of(false);
      });
  }
}
