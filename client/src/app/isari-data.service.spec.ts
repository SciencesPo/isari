/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { IsariDataService } from './isari-data.service';

describe('Service: IsariData', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IsariDataService]
    });
  });

  it('should ...', inject([IsariDataService], (service: IsariDataService) => {
    expect(service).toBeTruthy();
  }));
});
