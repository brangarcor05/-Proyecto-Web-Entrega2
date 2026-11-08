import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { Arco } from '../../../../models/arco/arco.model';
import { ArcoService } from '../../../../services/arco/arco.service';
import { ArcoPanelComponent } from './arco-panel.component';

describe('ArcoPanelComponent', () => {
  const arco: Arco = {
    id: 7,
    procesoId: 9,
    origenId: 10,
    origenNombre: 'Validar solicitud',
    destinoId: 11,
    destinoNombre: 'Aprobar solicitud',
    etiqueta: 'Aprobada',
    condicion: null,
    canvasId: 'Flow_1',
    activo: true,
  };

  let procesoConsultado: number | null;
  let respuesta: Arco[];
  let errorConsulta: unknown | null;

  beforeEach(async () => {
    procesoConsultado = null;
    respuesta = [arco];
    errorConsulta = null;

    await TestBed.configureTestingModule({
      imports: [ArcoPanelComponent],
      providers: [
        {
          provide: ArcoService,
          useValue: {
            listarPorProceso: (procesoId: number) => {
              procesoConsultado = procesoId;
              return errorConsulta ? throwError(() => errorConsulta) : of(respuesta);
            },
          },
        },
        { provide: ApiErrorService, useValue: { obtenerMensaje: () => 'No fue posible cargar los arcos.' } },
      ],
    }).compileComponents();
  });

  it('consulta y presenta los arcos del proceso', () => {
    const fixture = TestBed.createComponent(ArcoPanelComponent);
    fixture.componentRef.setInput('procesoId', 9);
    fixture.detectChanges();

    expect(procesoConsultado).toBe(9);
    expect(fixture.componentInstance.arcosPersistidos()).toEqual([arco]);
    expect(fixture.nativeElement.textContent).toContain('Validar solicitud');
    expect(fixture.nativeElement.textContent).toContain('Aprobar solicitud');
  });

  it('informa cuando el proceso no tiene arcos', () => {
    respuesta = [];
    const fixture = TestBed.createComponent(ArcoPanelComponent);
    fixture.componentRef.setInput('procesoId', 9);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No existen Arcos asociados');
  });

  it('conserva un mensaje comprensible cuando la consulta falla', () => {
    errorConsulta = new Error('fallo');
    const fixture = TestBed.createComponent(ArcoPanelComponent);
    fixture.componentRef.setInput('procesoId', 9);
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBe('No fue posible cargar los arcos.');
    expect(fixture.componentInstance.arcosPersistidos()).toEqual([]);
  });

  it('presenta inmediatamente los flujos existentes en el lienzo', () => {
    const fixture = TestBed.createComponent(ArcoPanelComponent);
    fixture.componentRef.setInput('procesoId', 9);
    fixture.componentRef.setInput('arcosDiagrama', [{
      id: 'Flow_1',
      origenId: 'Start_1',
      origenNombre: 'Inicio',
      destinoId: 'Task_1',
      destinoNombre: 'Revisar solicitud',
      etiqueta: 'Continuar',
      condicion: null,
    }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Inicio');
    expect(fixture.nativeElement.textContent).toContain('Revisar solicitud');
    expect(fixture.nativeElement.textContent).toContain('Continuar');
  });
});
