import { Observable } from 'rxjs/Observable';
import { Component, OnInit, Input } from '@angular/core';
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
  organizationName: string;
  lang: string;
  logged: boolean = false;
  historyAccess: boolean = false;
  user: any = null;

  @Input() overrideOrganizationName: string;
  @Input() globalOrganization: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private userService: UserService,
    private isariDataService: IsariDataService) {}

  ngOnInit() {
    this.organizationName = this.overrideOrganizationName;
    this.lang = this.translate.currentLang;

    // shouldn't be a test on user ?
    // this.route.url.subscribe(url => {
    //   const firstSegment = url[0];
    //   this.logged = !firstSegment || firstSegment.path !== 'login';
    // });

    Observable.combineLatest([
      this.route.data,
      this.userService.isLoggedIn()
    ]).subscribe(([{ organization }, { people }]) => {
      this.user = people;

      this.organization = organization;
      if (!this.overrideOrganizationName) {
        this.organizationName = organization && (organization.acronym || organization.name);
      }

      // https://github.com/SciencesPo/isari/issues/445
      this.historyAccess = this.user.isariAuthorizedCenters.find(({ isariRole, org }) =>
        isariRole === 'central_admin'
        || (isariRole === 'center_admin' && org === this.organization.id)
      );
    });
  }

  logout($event) {
    $event.preventDefault();
    this.userService.logout().subscribe(res => {
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
      'xlsx',
      'hceres',
      {id: this.organization.id}
    );
  }

  getAnnex4DownloadLink() {
    if (!this.organization) {
      return null;
    }

    return this.isariDataService.createExportDownloadLink(
      'html',
      'annex4',
      {id: this.organization.id}
    );
  }

  getHCERESNextDownloadLink() {
    if (!this.organization) {
      return null;
    }

    return this.isariDataService.createExportDownloadLink(
      'xlsx',
      'next',
      {id: this.organization.id}
    );
  }
}
