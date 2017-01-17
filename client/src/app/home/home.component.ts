import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';

@Component({
  selector: 'isari-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  organizations: any[];
  globalOrganization: any;

  constructor(private userService: UserService) { }

  ngOnInit() {
    this.userService.getOrganizations()
      .subscribe(perms => {
        this.organizations = perms.organizations;

        // Define "global organization": see #106, use first non fictional organization right now
        if (perms.organizations[0] && perms.organizations[0].id) {
          this.globalOrganization = perms.organizations[0];
        } else if (perms.organizations[1]) {
          this.globalOrganization = perms.organizations[1];
        } else {
          // ooops, no organization in user's set, that will just not work :(
          console.error('Error! Could not guess global organization, central links will not be generated');
        }
      });
  }

}
