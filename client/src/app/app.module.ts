import { LoaderService } from './loader/loader.service';
import { LoaderModule } from './loader/loader.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule, Http } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { Ng2PageScrollModule } from 'ng2-page-scroll';

// import { MaterialModule } from '@angular/material';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { ToasterModule } from 'angular2-toaster/angular2-toaster';
import { TextMaskModule } from 'angular2-text-mask';

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
import { IsariHeaderComponent } from './isari-header/isari-header.component';
import { IsariChartComponent } from './isari-chart/isari-chart.component';
import { IsariChartPeopleComponent } from './isari-chart/isari-chart-people/isari-chart-people.component';
import { IsariDownloadButtonComponent } from './isari-list/isari-download-button/isari-download-button.component';
import { CVComponent } from './cv/cv.component';
import { FocusMeDirective } from './fields/focus-me.directive';
import { ConfirmDialog } from './fields/confirm.component';
import { IsariCreationModal } from './isari-creation-modal/isari-creation-modal.component';
import { StorageService } from './storage.service';
import { LogTableComponent } from './log-table/log-table.component';
import { IsariLogsComponent } from './isari-logs/isari-logs.component';
import { IsariCloseModal } from './isari-editor/close.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';

// export function createTranslateLoader(http: HttpClient) {
//   return new TranslateHttpLoader(http, './assets/i18n/', '.json');
// }
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

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
    HomeComponent,
    IsariHeaderComponent,
    IsariChartComponent,
    IsariChartPeopleComponent,
    IsariDownloadButtonComponent,
    CVComponent,
    FocusMeDirective,
    ConfirmDialog,
    IsariCreationModal,
    LogTableComponent,
    IsariLogsComponent,
    IsariCloseModal
  ],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule,

    // MaterialModule.forRoot(),
    MatMenuModule,
    MatDialogModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatTooltipModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatAutocompleteModule,

    routing,
    HttpModule,
    HttpClientModule,
    Ng2PageScrollModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    ToasterModule.forRoot(),
    TextMaskModule,
    BrowserAnimationsModule,
    LoaderModule,
  ],
  providers: [
    IsariDataService,
    UserService,
    LoggedInGuard,
    OrganizationResolver,
    StorageService,
    LoaderService,
  ],
  entryComponents: [
    AppComponent,
    ConfirmDialog,
    IsariCreationModal,
    IsariCloseModal
  ],
  bootstrap: [
    AppComponent,
  ]
})
export class AppModule {

}
