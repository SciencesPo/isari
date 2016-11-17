import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { UserService } from './user.service';

@Injectable()
export class OrganizationResolver implements Resolve<any> {

  constructor(private userService: UserService) { }

  resolve(route: ActivatedRouteSnapshot) {
    return this.userService.getOrganization(route.queryParams['organization']);
  }

}
