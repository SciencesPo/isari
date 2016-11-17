import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import { UserService } from '../user.service';

@Component({
  selector: 'isari-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  errorMessage: string;
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
      .catch(this.handleError)
      .subscribe(res => {
        this.router.navigate(['']);
      }, error => {
        this.errorMessage = error.message || 'unknown error';
      });
  }

  handleError(error: any) {
    return Observable.throw(error.json());
  }

}
