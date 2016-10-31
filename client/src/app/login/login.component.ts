import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { UserService } from '../user.service';

@Component({
  selector: 'isari-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  message: string;
  loginForm: FormGroup;

  constructor(
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      login: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(form) {
    this.userService.login(form.value.login, form.value.password)
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
