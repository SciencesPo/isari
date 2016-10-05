/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { IsariFieldSelectorService } from './isari-field-selector.service';

describe('Service: IsariFieldSelector', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IsariFieldSelectorService]
    });
  });

  it('should ...', inject([IsariFieldSelectorService], (service: IsariFieldSelectorService) => {
    expect(service).toBeTruthy();
  }));
});
