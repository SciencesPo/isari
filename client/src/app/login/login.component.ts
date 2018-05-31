import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable, throwError } from 'rxjs';
import { UserService } from '../user.service';
import { IsariDataService } from '../isari-data.service';
import { concat, catchError } from 'rxjs/operators';

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
    private isariDataService: IsariDataService,
    private router: Router,
    private fb: FormBuilder) { }

  ngOnInit() {
    this.loginForm = this.fb.group({
      login: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(form) {
    this.userService.login(form.value.login, form.value.password)
      .pipe(
        concat(this.isariDataService.buildEnumCache()),
        catchError(this.handleError)
      )
      .subscribe(
        res => {
          this.isariDataService.clearCache(),
            this.router.navigate(['']);
        },
        error => {
          if (error.error && error.error.status === 403) {
            this.errorMessage = 'no_org error';
          } else if (error.error && error.error.status === 401) {
            this.errorMessage = 'login error';
          } else if (error.message) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'unknown error';
          }
        }
      );
  }

  handleError(error: any) {
    return throwError(error.json());
  }

}
