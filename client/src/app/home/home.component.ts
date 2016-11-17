import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';

@Component({
  selector: 'isari-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  organizations: any[];

  constructor(private userService: UserService) { }

  ngOnInit() {
    this.userService.getOrganizations()
      .subscribe(perms => {
        this.organizations = perms.organizations;
      });
  }

}
