import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'isari-detail-page',
  templateUrl: 'detail-page.component.html',
  styleUrls: ['detail-page.component.css']
})
export class DetailPageComponent implements OnInit {

  data: any;
  feature: string;

  constructor (private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params
      .subscribe(({ feature }) => {
        this.feature = feature;
      });

    this.data = {
      name: 'Jean'
    };
  }

}
