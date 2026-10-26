import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ServiceOrderService } from './service-order.service';

describe('ServiceOrderService', () => {
  let service: ServiceOrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ServiceOrderService],
    });
    service = TestBed.inject(ServiceOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('changes status with POST to the status subresource', () => {
    service.changeStatus(42, 'en_diagnostico').subscribe();

    const req = httpMock.expectOne('/api/v1/service-orders/42/status');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ to_status: 'en_diagnostico' });
    req.flush({});
  });
});
