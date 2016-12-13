import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';

@Component({
  selector: 'isari-cv',
  templateUrl: './cv.component.html',
  styleUrls: ['./cv.component.css']
})
export class CVComponent implements OnInit {

  private userId: string;

  constructor(
    private userService: UserService,
  ) { }

  ngOnInit () {
    this.userService.isLoggedIn().subscribe(user => {
      if (user && user.people) {
        this.userId = user.people.id;
      }
    });
  }

}
