import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { TranslateService}  from 'ng2-translate';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  lang = 'en';

  constructor(
    private userService: UserService,
    private router: Router,
    private translate: TranslateService) {
    this.translate.setDefaultLang(this.lang);
    this.translate.use(this.lang);
  }

  onLogout($event) {
    $event.preventDefault();
    this.userService.logout()
      .subscribe(res => {
        this.router.navigate(['login']);
      });
  }

  setLang(lang, $event) {
    $event.preventDefault();
    this.lang = lang;
    this.translate.use(this.lang);
  }

}
