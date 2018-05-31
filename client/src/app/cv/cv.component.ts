import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { Observable, combineLatest } from 'rxjs';

@Component({
  selector: 'isari-cv',
  templateUrl: './cv.component.html',
  styleUrls: ['./cv.component.css']
})
export class CVComponent implements OnInit {

  userId: string;

  // Ensure we don't call data editor too soon: wait for organization to be resolved
  ready: boolean = false;

  constructor(
    private userService: UserService,
  ) { }

  ngOnInit() {
    combineLatest(
      this.userService.getOrganizations(),
      this.userService.isLoggedIn()
    ).subscribe((data: any) => { // TODO proper type definition
      const [{ organizations, central }, user] = data;
      if (!user || !user.people) {
        // TODO error message: invalid session status
        this.ready = false;
      } else if (!organizations || organizations.length === 0) {
        // TODO error message: no organization accessible
        this.ready = false;
      } else if (organizations.length === 1 && central) {
        // TODO error message: no organization accessible except the virtual global one
        this.ready = false;
      } else {
        // User is logged in and has several organizations accessible: take the first one with a valid id
        this.userService.setCurrentOrganizationId(organizations[0].id || organizations[1].id);
        this.userId = user.people.id;
        this.ready = true;
      }
    });
  }

}
