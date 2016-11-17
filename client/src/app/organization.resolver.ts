import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { UserService } from './user.service';

@Injectable()
export class OrganizationResolver implements Resolve<any> {

  constructor(private userService: UserService, private router: Router) { }

  resolve(route: ActivatedRouteSnapshot) {
    return this.userService.getOrganization(route.queryParams['organization'])
      .map(organization => {
        if (!organization) {
          this.router.navigate(['/']);
        }
        return organization;
      });
  }

}
