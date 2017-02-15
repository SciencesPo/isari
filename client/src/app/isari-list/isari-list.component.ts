import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/startWith';
import { IsariDataService } from '../isari-data.service';
import { TranslateService } from 'ng2-translate';
import { MdDialogRef, MdDialog } from '@angular/material';
import { IsariCreationModal } from '../isari-creation-modal/isari-creation-modal.component';
import { StorageService } from '../storage.service';
import { UserService } from '../user.service';
import { pad } from '../utils';

@Component({
  selector: 'isari-list',
  templateUrl: './isari-list.component.html',
  styleUrls: ['./isari-list.component.css']
})
export class IsariListComponent implements OnInit {

  dialogRef: MdDialogRef<IsariCreationModal>;
  feature: string;
  externals: boolean;
  loading: boolean = false;
  data: any[] = [];
  filteredData: any[] = [];
  cols: any[] = [];
  editedId: string = '';
  selectedColumns: any[] = [];
  dateForm: FormGroup;
  activityTypes: any[] = [];
  activityType: string;
  activityTypeLabel: string;
  canCreate = false;

  constructor (
    private userService: UserService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private isariDataService: IsariDataService,
    private translate: TranslateService,
    private titleService: Title,
    private dialog: MdDialog) {}

  private today() {
    const d = new Date();
    return [pad(d.getFullYear(), 4), pad(d.getMonth() + 1, 2), pad(d.getDate(), 2)].join('-');
  }

  ngOnInit() {
    this.dateForm = new FormGroup({
      startDate: new FormControl(''),
      endDate: new FormControl('')
    });

    this.userService.organizations.subscribe(orgs => this.canCreate = orgs.central !== 'reader');

    this.route.params
      .subscribe(({ feature, externals, type }) => {
        this.feature = feature;

        this.translate.get(feature).subscribe(featureTranslated => {
          this.titleService.setTitle(featureTranslated);
        });

        this.activityType = type || null;
        this.activityTypeLabel = this.activityTypes.length && this.activityType ?
          this.activityTypes.find(type => type.value === this.activityType).label.fr :
          null;

        this.externals = !!externals;
        this.isariDataService.getColumns(feature)
          .then(columns => {
            this.cols = columns;
          });

        // set date filters
        const dateFilters = this.storageService.get('dateFilters', this.feature) || {};
        this.dateForm.controls['startDate'].setValue(dateFilters['startDate'] || this.today());
        this.dateForm.controls['endDate'].setValue(dateFilters['endDate'] || '');

        this.selectedColumns = this.storageService.get('colSelected', this.feature);
        if (!this.selectedColumns) {
          this.isariDataService.getColumnsWithDefault(feature)
            .then(defaultColumns => {
              this.selectedColumns = defaultColumns;
              this.loadDatas();
            });
        } else {
          this.loadDatas();
        }

      });

    this.isariDataService.getEnum('activityTypes')

      // Je ne comprends pas pourquoi je suis obligé de faire ça sous peine d'erreur TS
      .subscribe((...args) => {

        // TODO: translate
        this.activityTypes = args[0];

        if (this.activityType) {
          this.activityTypeLabel = this.activityTypes.find(type => type.value === this.activityType).label.fr;
        }
      });

    // get activated item in editor
    let editorRoute = this.route.parent.children.find(route => route.outlet === 'editor');
    if (editorRoute) {
      editorRoute.params.subscribe(({ id }) => {
        this.editedId = id;
      });
    }
  }

  colSelected($event) {
    this.storageService.save($event.cols, 'colSelected', this.feature);
    this.selectedColumns = $event.cols;
    this.loadDatas();
  }

  startDateUpdated($event) {
    this.storageService.upsert(this.dateForm.value.startDate, 'dateFilters', this.feature, 'startDate');
    this.loadDatas();
  }

  endDateUpdated($event) {
    this.storageService.upsert(this.dateForm.value.endDate, 'dateFilters', this.feature, 'endDate');
    this.loadDatas();
  }

  filtered($event) {
    this.filteredData = $event.data;
  }

  createObject() {
      this.dialogRef = this.dialog.open(IsariCreationModal, {
        disableClose: false
      });

      this.dialogRef.componentInstance.feature = this.feature;

      this.dialogRef.afterClosed().subscribe(result => {
        if (result) {
          //this.onDelete.emit($event);
        }
        this.dialogRef = null;
      });
  }

  refresh() {
    this.loadDatas()
  }

  private loadDatas() {
    // this.data = [];
    this.loading = true;
    this.isariDataService.getDatas(this.feature, {
      fields: this.selectedColumns.map(col => col.key),
      applyTemplates: true,
      externals: this.externals,
      start: this.dateForm.value.startDate,
      end: this.dateForm.value.endDate,
      type: this.activityType
    }).then(data => {
      this.loading = false;
      this.data = data;
      this.filteredData = [...data];
    });
  }

}
