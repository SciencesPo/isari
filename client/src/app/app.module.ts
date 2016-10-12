import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule }           from '@angular/http';

import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService }  from './in-memory-data.service';

import { MaterialModule } from '@angular/material';

import { IsariDataService } from './isari-data.service';

import { routing } from './app.routing';
import { AppComponent } from './app.component';
import { ListPageComponent } from './list-page/list-page.component';
import { DetailPageComponent } from './detail-page/detail-page.component';
import { DataTableComponent } from './data-table/data-table.component';
import { DataEditorComponent } from './data-editor/data-editor.component';
import { FieldComponent } from './fields/field.component';
import { DisabledDirective } from './fields/disabled.directive';

import { IsariInputComponent } from './fields/isari-input/isari-input.component';
import { IsariSelectComponent } from './fields/isari-select/isari-select.component';
import { IsariDateComponent } from './fields/isari-date/isari-date.component';

@NgModule({
  declarations: [
    AppComponent,
    ListPageComponent,
    DetailPageComponent,
    DataTableComponent,
    DataEditorComponent,
    FieldComponent,
    DisabledDirective,
    IsariInputComponent,
    IsariSelectComponent,
    IsariDateComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule,
    MaterialModule.forRoot(),
    routing,
    HttpModule,
    InMemoryWebApiModule.forRoot(InMemoryDataService)
  ],
  providers: [
    IsariDataService,
  ],
  entryComponents: [
    AppComponent,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
