/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { IsariColComponent } from './isari-col.component';

describe('IsariColComponent', () => {
  let component: IsariColComponent;
  let fixture: ComponentFixture<IsariColComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IsariColComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IsariColComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
