import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Client, ClientCreate, ClientDetail, ClientUpdate } from '../models/client.model';
import { ClientService } from './client.service';

describe('ClientService', () => {
  let service: ClientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ClientService],
    });
    service = TestBed.inject(ClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists clients without query', () => {
    const mockClients: Client[] = [
      {
        id: 1,
        first_name: 'Ana',
        last_name: 'Pérez',
        document: '30111222',
        phone: '3415551234',
        email: 'ana@example.com',
        address: null,
        created_at: '2026-10-24T10:00:00Z',
        updated_at: '2026-10-24T10:00:00Z',
      },
    ];

    service.list().subscribe((clients) => {
      expect(clients).toEqual(mockClients);
    });

    const req = httpMock.expectOne('/api/v1/clients');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('q')).toBe(false);
    req.flush(mockClients);
  });

  it('lists clients with query parameter', () => {
    service.list('Pérez').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/v1/clients' && r.params.get('q') === 'Pérez');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets client detail with equipments', () => {
    const mockDetail: ClientDetail = {
      id: 1,
      first_name: 'Ana',
      last_name: 'Pérez',
      document: null,
      phone: '3415551234',
      email: null,
      address: null,
      created_at: '2026-10-24T10:00:00Z',
      updated_at: '2026-10-24T10:00:00Z',
      equipments: [],
    };

    service.get(1).subscribe((detail) => {
      expect(detail).toEqual(mockDetail);
    });

    const req = httpMock.expectOne('/api/v1/clients/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockDetail);
  });

  it('creates a client', () => {
    const payload: ClientCreate = {
      first_name: 'Carlos',
      last_name: 'Gómez',
      phone: '3419998888',
    };
    const created: Client = {
      id: 2,
      first_name: 'Carlos',
      last_name: 'Gómez',
      document: null,
      phone: '3419998888',
      email: null,
      address: null,
      created_at: '2026-10-24T10:00:00Z',
      updated_at: '2026-10-24T10:00:00Z',
    };

    service.create(payload).subscribe((res) => {
      expect(res).toEqual(created);
    });

    const req = httpMock.expectOne('/api/v1/clients');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(created);
  });

  it('updates a client', () => {
    const payload: ClientUpdate = { phone: '3411112222' };
    service.update(1, payload).subscribe();

    const req = httpMock.expectOne('/api/v1/clients/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });
});

