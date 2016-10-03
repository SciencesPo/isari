import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { routing } from './app.routing';
import { AppComponent } from './app.component';
import { ListPageComponent } from './list-page/list-page.component';
import { DetailPageComponent } from './detail-page/detail-page.component';
import { DataTableComponent } from './data-table/data-table.component';
import { DataEditorComponent } from './data-editor/data-editor.component';
import { FieldComponent } from './field/field.component';
import { IsariInputComponent } from './fields/isari-input/isari-input.component';

@NgModule({
  declarations: [
    AppComponent,
    ListPageComponent,
    DetailPageComponent,
    DataTableComponent,
    DataEditorComponent,
    FieldComponent,
    IsariInputComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule,
    routing
  ],
  providers: [],
  entryComponents: [
    AppComponent,
    IsariInputComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
