import { Component } from '@angular/core';
import { TranslateService}  from 'ng2-translate';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  lang = 'fr';

  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang(this.lang);
    this.translate.use(this.lang);
  }

}
