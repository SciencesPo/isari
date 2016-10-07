import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MdSnackBar, MdSnackBarConfig } from '@angular/material';

import { IsariDataService } from '../isari-data.service';

@Component({
  selector: 'isari-detail-page',
  templateUrl: 'detail-page.component.html',
  styleUrls: ['detail-page.component.css'],
  providers: [MdSnackBar]
})
export class DetailPageComponent implements OnInit {

  feature: string;
  data: any;
  layout: any;

  constructor(
    private route: ActivatedRoute,
    private isariDataService: IsariDataService,
    private snackBar: MdSnackBar,
    private viewContainerRef: ViewContainerRef) {}

  ngOnInit() {
    this.route.params
      .subscribe(({ feature, id }) => {
        this.feature = feature;
        Promise.all([
          this.isariDataService.getPeople(+id), // @TODO dependson feature
          this.isariDataService.getLayout(this.feature)
        ]).then(([data, layout]) => {
          this.data = data;
          this.layout = layout;
        });
      });
  }

  save (obj) {
    // let config = new MdSnackBarConfig(this.viewContainerRef);
    if (!obj.errors) {
      this.data = obj;
      // this.snackBar.open('Saved', '', config);
    } else {
      // this.snackBar.open('', 'Errors', config);
    }
  }

}
