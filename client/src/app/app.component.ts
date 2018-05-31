import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  lang = 'fr';

  constructor(private translate: TranslateService) {
    console.log('translate', translate);
    this.translate.setDefaultLang(this.lang);
    this.translate.use(this.lang);
  }

}
