import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService}  from 'ng2-translate';
import { UserService }  from '../user.service';

@Component({
  selector: 'isari-header',
  templateUrl: './isari-header.component.html',
  styleUrls: ['./isari-header.component.css']
})
export class IsariHeaderComponent implements OnInit {
  organization: any;
  lang: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private userService: UserService) {}

  ngOnInit() {
    this.route.data.subscribe(({ organization }) => {
      this.organization = organization;
    });
    this.lang = this.translate.currentLang;
  }

  logout($event) {
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
