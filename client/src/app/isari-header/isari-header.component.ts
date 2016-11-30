import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService}  from 'ng2-translate';
import { IsariDataService } from '../isari-data.service';
import { UserService }  from '../user.service';

@Component({
  selector: 'isari-header',
  templateUrl: './isari-header.component.html',
  styleUrls: ['./isari-header.component.css']
})
export class IsariHeaderComponent implements OnInit {
  organization: any;
  lang: string;
  logged: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private userService: UserService,
    private isariDataService: IsariDataService) {}

  ngOnInit() {
    this.route.data.subscribe(({ organization }) => {
      this.organization = organization;
    });
    this.route.url.subscribe(url => {
      const firstSegment = url[0];

      this.logged = !firstSegment || firstSegment.path !== 'login';
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

    if (this.lang === lang) {
      return;
    }

    this.lang = lang;
    this.translate.use(this.lang);
  }

  getHCERESDowloadLink() {
    if (!this.organization) {
      return null;
    }

    return this.isariDataService.createExportDownloadLink(
      'hceres',
      {id: this.organization.id}
    );
  }
}
