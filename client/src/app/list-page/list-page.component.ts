import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs/Rx';


@Component({
  selector: 'list-page',
  templateUrl: 'list-page.component.html',
  styleUrls: ['list-page.component.css']
})
export class ListPageComponent implements OnInit {

  feature: string;
  data: Subject<any>;

  constructor (private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params
      .subscribe(({ feature }) => {
        this.feature = feature;
      });

    this.data = new Subject();

    Observable
      .timer(2500)
      .combineLatest(Observable.from([ [ 1, 2, 3 ] ]))
      .subscribe(([ , data ]) => {
        this.data.next(data);
      });
  }

  reloadData ($event) {
    this.data.next([ 2, 3, 4 ]);
  }

}
