import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Equipment,
  EquipmentCreate,
  EquipmentDetail,
  EquipmentUpdate,
} from '../models/equipment.model';

const BASE_URL = '/api/v1/equipments';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private readonly http = inject(HttpClient);

  create(payload: EquipmentCreate): Observable<Equipment> {
    return this.http.post<Equipment>(BASE_URL, payload);
  }

  get(id: number): Observable<EquipmentDetail> {
    return this.http.get<EquipmentDetail>(`${BASE_URL}/${id}`);
  }

  update(id: number, payload: EquipmentUpdate): Observable<Equipment> {
    return this.http.patch<Equipment>(`${BASE_URL}/${id}`, payload);
  }
}
