import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { EventoDetailComponent } from './evento-detail.component';
import { EventoService } from '../../../../services/evento/evento.service';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { ProcesoService } from '../../../../services/proceso/proceso.service';

describe('EventoDetailComponent', () => {
  let serviceMock: any;
  let authMock: any;
  let procesoServiceMock: any;

  const mockEvento = { id: 1, procesoId: 10, nombre: 'Evento Test', activo: true };
  const mockProceso = { id: 10, empresaId: 1, soloLectura: false, estado: 'BORRADOR' };

  beforeEach(async () => {
    serviceMock = {
      buscarPorId: vi.fn().mockReturnValue(of(mockEvento)),
      eliminar: vi.fn().mockReturnValue(of(undefined))
    };
    authMock = {
      sesion: signal({ usuarioId: 1, empresaId: 1, rolUsuario: 'ADMIN' })
    };
    procesoServiceMock = {
      buscarPorId: vi.fn().mockReturnValue(of(mockProceso))
    };

    await TestBed.configureTestingModule({
      imports: [EventoDetailComponent],
      providers: [
        provideRouter([]),
        { provide: EventoService, useValue: serviceMock },
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

  it('debería cargar el evento al iniciar', () => {
    const fixture = TestBed.createComponent(EventoDetailComponent);
    fixture.detectChanges();
    expect(serviceMock.buscarPorId).toHaveBeenCalledWith(1);
  });

  it('debería abrir el diálogo de confirmación al intentar eliminar', () => {
    const fixture = TestBed.createComponent(EventoDetailComponent);
    fixture.detectChanges();
    // Forzamos el proceso para que el getter puedeEliminar funcione
    fixture.componentInstance.proceso = mockProceso as any;
    fixture.componentInstance.eliminar(mockEvento as any);
    expect(fixture.componentInstance.pendiente).toEqual(mockEvento);
  });

  it('debería cancelar la eliminación', () => {
    const fixture = TestBed.createComponent(EventoDetailComponent);
    fixture.componentInstance.pendiente = mockEvento as any;
    fixture.componentInstance.eliminando = false;
    fixture.componentInstance.cancelarEliminacion();
    expect(fixture.componentInstance.pendiente).toBeNull();
  });

      it('debería llamar al servicio para eliminar al confirmar', async () => {
    const fixture = TestBed.createComponent(EventoDetailComponent);
    
    
    fixture.componentInstance.proceso = mockProceso as any;
    fixture.componentInstance.procesoId = 10; // El mismo procesoId del mockEvento
    fixture.componentInstance.pendiente = mockEvento as any;
    
   
    vi.spyOn(fixture.componentInstance as any, 'puedeEliminar', 'get').mockReturnValue(true);

    fixture.componentInstance.confirmarEliminacion();

    await fixture.whenStable();

    expect(serviceMock.eliminar).toHaveBeenCalledWith(1);
  });
});