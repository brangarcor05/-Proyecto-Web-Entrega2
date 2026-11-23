import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { NotificacionExternaDetailComponent } from './notificacion-detail.component';
import { NotificacionExternaService } from '../../../../services/notificacionExterna/notificacion-externa.service';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { ProcesoService } from '../../../../services/proceso/proceso.service';

describe('NotificacionExternaDetailComponent', () => {
  let serviceMock: any;
  let authMock: any;
  let procesoServiceMock: any;

  const mockNotificacion = { id: 1, procesoId: 10, nombre: 'Notificacion Test', activo: true };
  const mockProceso = { id: 10, empresaId: 1, soloLectura: false, estado: 'BORRADOR' };

  beforeEach(async () => {
    serviceMock = {
      buscarPorId: vi.fn().mockReturnValue(of(mockNotificacion)),
      eliminar: vi.fn().mockReturnValue(of(undefined))
    };
    authMock = {
      sesion: signal({ usuarioId: 1, empresaId: 1, rolUsuario: 'ADMIN' })
    };
    procesoServiceMock = {
      buscarPorId: vi.fn().mockReturnValue(of(mockProceso))
    };

    await TestBed.configureTestingModule({
      imports: [NotificacionExternaDetailComponent],
      providers: [
        provideRouter([]),
        { provide: NotificacionExternaService, useValue: serviceMock },
        { provide: AutenticacionService, useValue: authMock },
        { provide: ProcesoService, useValue: procesoServiceMock },
        { 
          provide: ActivatedRoute, 
          useValue: { 
            paramMap: of(convertToParamMap({ procesoId: '10', id: '1' })),
            snapshot: { paramMap: convertToParamMap({ procesoId: '10', id: '1' }) }
          } 
        }
      ]
    }).compileComponents();
    const router = TestBed.inject(Router);
vi.spyOn(router, 'navigate').mockResolvedValue(true);
});

  it('debería cargar la notificación al iniciar', () => {
    const fixture = TestBed.createComponent(NotificacionExternaDetailComponent);
    fixture.detectChanges();
    expect(serviceMock.buscarPorId).toHaveBeenCalledWith(1);
  });

  it('debería abrir el diálogo de confirmación al intentar eliminar', () => {
    const fixture = TestBed.createComponent(NotificacionExternaDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.proceso = mockProceso as any;
    fixture.componentInstance.eliminar(mockNotificacion as any);
    expect(fixture.componentInstance.pendiente).toEqual(mockNotificacion);
  });

  it('debería cancelar la eliminación', () => {
    const fixture = TestBed.createComponent(NotificacionExternaDetailComponent);
    fixture.componentInstance.pendiente = mockNotificacion as any;
    fixture.componentInstance.eliminando = false;
    fixture.componentInstance.cancelarEliminacion();
    expect(fixture.componentInstance.pendiente).toBeNull();
  });

  it('debería llamar al servicio para eliminar al confirmar', async () => {
    const fixture = TestBed.createComponent(NotificacionExternaDetailComponent);
    
    
    fixture.componentInstance.proceso = mockProceso as any;
    fixture.componentInstance.procesoId = 10;
    fixture.componentInstance.pendiente = mockNotificacion as any;
    
    vi.spyOn(fixture.componentInstance as any, 'puedeEliminar', 'get').mockReturnValue(true);

    fixture.componentInstance.confirmarEliminacion();

    await fixture.whenStable();

    expect(serviceMock.eliminar).toHaveBeenCalledWith(1);
  });
});