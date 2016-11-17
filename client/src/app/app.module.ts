import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule, Http } from '@angular/http';

import { Ng2PageScrollModule } from 'ng2-page-scroll';
import { MaterialModule } from '@angular/material';
import { TranslateModule, TranslateLoader, TranslateStaticLoader } from 'ng2-translate';

import { IsariDataService } from './isari-data.service';
import { UserService } from './user.service';
import { LoggedInGuard } from './logged-in.guard';
import { OrganizationResolver } from './organization.resolver';

import { routing } from './app.routing';
import { AppComponent } from './app.component';
import { IsariListComponent } from './isari-list/isari-list.component';
import { IsariEditorComponent } from './isari-editor/isari-editor.component';
import { DataTableComponent } from './data-table/data-table.component';
import { DataEditorComponent } from './data-editor/data-editor.component';
import { FieldComponent } from './fields/field.component';
import { DisabledDirective } from './fields/disabled.directive';

import { IsariInputComponent } from './fields/isari-input/isari-input.component';
import { IsariSelectComponent } from './fields/isari-select/isari-select.component';
import { IsariDateComponent } from './fields/isari-date/isari-date.component';
import { IsariPaginationComponent } from './data-table/isari-pagination/isari-pagination.component';
import { IsariColsSelectorComponent } from './isari-list/isari-cols-selector/isari-cols-selector.component';
import { IsariMultiInputComponent } from './fields/isari-multi-input/isari-multi-input.component';
import { IsariMultiSelectComponent } from './fields/isari-multi-select/isari-multi-select.component';
import { IsariLayoutComponent } from './isari-layout/isari-layout.component';
import { LoginComponent } from './login/login.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { IsariColComponent } from './data-table/isari-col/isari-col.component';
import { IsariCheckboxComponent } from './fields/isari-checkbox/isari-checkbox.component';
import { IsariTextareaComponent } from './fields/isari-textarea/isari-textarea.component';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    IsariListComponent,
    IsariEditorComponent,
    DataTableComponent,
    DataEditorComponent,
    FieldComponent,
    DisabledDirective,
    IsariInputComponent,
    IsariSelectComponent,
    IsariDateComponent,
    IsariPaginationComponent,
    IsariColsSelectorComponent,
    IsariMultiInputComponent,
    IsariMultiSelectComponent,
    IsariLayoutComponent,
    LoginComponent,
    SpinnerComponent,
    IsariColComponent,
    IsariCheckboxComponent,
    IsariTextareaComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule,
    MaterialModule.forRoot(),
    routing,
    HttpModule,
    Ng2PageScrollModule.forRoot(),
    TranslateModule.forRoot({
      provide: TranslateLoader,
      useFactory: (http: Http) => new TranslateStaticLoader(http, '/assets/i18n', '.json'),
      deps: [Http]
    })
  ],
  providers: [
    IsariDataService,
    UserService,
    LoggedInGuard,
    OrganizationResolver
  ],
  entryComponents: [
    AppComponent,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
