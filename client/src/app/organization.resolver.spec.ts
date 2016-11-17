/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { OrganizationResolver } from './organization.resolver';

describe('Service: OrganizationResolver', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrganizationResolver]
    });
  });

  it('should ...', inject([OrganizationResolver], (service: OrganizationResolver) => {
    expect(service).toBeTruthy();
  }));
});
