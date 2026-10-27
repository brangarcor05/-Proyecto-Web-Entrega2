import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { Historial } from '../../../../models/proceso/historial.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { ProcesoService } from '../../../../services/proceso/proceso.service';
import { ProcesoHistoryComponent } from './proceso-history.component';

describe('ProcesoHistoryComponent', () => {
  const sesionActiva: SesionResponse = {
    usuarioId: 2,
    nombre: 'Usuario',
    email: 'usuario@example.com',
    rolUsuario: 'LECTURA',
    empresaId: 6,
    empresaNombre: 'Empresa',
  };
  const historial: Historial[] = [{
    id: 1,
    entidadTipo: 'PROCESO',
    entidadId: 12,
    accion: 'CREACION',
    detalle: 'Proceso creado',
    fecha: '2026-10-20T10:00:00',
    usuarioId: 2,
    usuarioNombre: 'Usuario',
  }];

  let sesion: SesionResponse | null;
  let routeId: string | null;
  let navegacion: unknown[] | null;
  let consulta: { id: number; empresaId: number } | null;

  beforeEach(async () => {
    sesion = sesionActiva;
    routeId = '12';
    navegacion = null;
    consulta = null;

    await TestBed.configureTestingModule({
      imports: [ProcesoHistoryComponent],
      providers: [
        { provide: AutenticacionService, useValue: { sesion: () => sesion } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => routeId } } } },
        {
          provide: Router,
          useValue: {
            navigate: (comandos: unknown[]) => {
              navegacion = comandos;
              return Promise.resolve(true);
            },
          },
        },
        {
          provide: ProcesoService,
          useValue: {
            consultarHistorial: (id: number, empresaId: number) => {
              consulta = { id, empresaId };
              return of(historial);
            },
          },
        },
        { provide: ApiErrorService, useValue: { obtenerMensaje: () => 'Error' } },
      ],
    })
      .overrideComponent(ProcesoHistoryComponent, { set: { template: '' } })
      .compileComponents();
  });

  it('consulta el historial con el proceso y la empresa correctos', () => {
    const fixture = TestBed.createComponent(ProcesoHistoryComponent);
    fixture.detectChanges();

    expect(consulta).toEqual({ id: 12, empresaId: 6 });
    expect(fixture.componentInstance.registros).toEqual(historial);
  });

  it('redirige al login cuando no existe sesión', () => {
    sesion = null;
    const fixture = TestBed.createComponent(ProcesoHistoryComponent);
    fixture.detectChanges();

    expect(navegacion).toEqual(['/login']);
    expect(consulta).toBeNull();
  });

  it('rechaza un identificador de proceso inválido', () => {
    routeId = 'texto';
    const fixture = TestBed.createComponent(ProcesoHistoryComponent);
    fixture.detectChanges();

    expect(consulta).toBeNull();
    expect(fixture.componentInstance.error).toContain('no es válido');
  });
});
