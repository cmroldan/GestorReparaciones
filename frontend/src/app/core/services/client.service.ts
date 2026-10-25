import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Client, ClientCreate, ClientDetail, ClientUpdate } from '../models/client.model';

const BASE_URL = '/api/v1/clients';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);

  list(q?: string): Observable<Client[]> {
    return this.http.get<Client[]>(BASE_URL, {
      params: q ? { q } : undefined,
    });
  }

  get(id: number): Observable<ClientDetail> {
    return this.http.get<ClientDetail>(`${BASE_URL}/${id}`);
  }

  create(payload: ClientCreate): Observable<Client> {
    return this.http.post<Client>(BASE_URL, payload);
  }

  update(id: number, payload: ClientUpdate): Observable<Client> {
    return this.http.patch<Client>(`${BASE_URL}/${id}`, payload);
  }
}
