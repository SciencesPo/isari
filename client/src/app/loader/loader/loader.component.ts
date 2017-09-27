import { Observable } from 'rxjs/Observable';
import { LoaderService } from './../loader.service';
import { Component } from '@angular/core';

@Component({
  selector: 'loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent {

  loader$: Observable<boolean>;

  constructor(private loaderService: LoaderService) {
    this.loader$ = loaderService.loader$;
  }

}
