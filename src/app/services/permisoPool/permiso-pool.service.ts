import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ConfigurarPermisoPoolRequest } from '../../models/permisopool/configurar-permiso-pool-request.model';
import { PermisoPool } from '../../models/permisopool/permiso-pool.model';

@Injectable({ providedIn: 'root' })
export class PermisoPoolService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/permisos-pool`;

  consultar(): Observable<PermisoPool[]> {
    return this.http.get<PermisoPool[]>(this.apiUrl);
  }

  configurar(
    request: ConfigurarPermisoPoolRequest
  ): Observable<PermisoPool> {
    return this.http.put<PermisoPool>(this.apiUrl, request);
  }
}
