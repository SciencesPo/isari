/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { IsariMultiInputComponent } from './isari-multi-input.component';

describe('IsariMultiInputComponent', () => {
  let component: IsariMultiInputComponent;
  let fixture: ComponentFixture<IsariMultiInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IsariMultiInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IsariMultiInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
