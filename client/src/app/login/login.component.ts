import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { UserService } from '../user.service';

@Component({
  selector: 'isari-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  message: string;

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit() {
  }

  login(username, password) {
    this.userService.login(username, password)
//      .catch(this.handleError)
      .subscribe(res => {
        this.router.navigate(['']);
      });
  }

  // handleError(error: any) {
  //   this.message = 'Wrong password / username';
  //   return Observable.throw('err');
  // }

}
