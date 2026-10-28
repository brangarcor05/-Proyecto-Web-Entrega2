import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

vi.mock('bpmn-js/lib/Modeler', () => ({ default: class {} }));
vi.mock('bpmn-js/lib/NavigatedViewer', () => ({ default: class {} }));
vi.mock('bpmn-js-properties-panel', () => ({
  BpmnPropertiesPanelModule: {},
  BpmnPropertiesProviderModule: {},
}));

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { Proceso } from '../../../../models/proceso/proceso.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { ProcesoService } from '../../../../services/proceso/proceso.service';
import { BpmnEditorComponent } from './bpmn-editor.component';

describe('BpmnEditorComponent', () => {
  const sesionAdmin: SesionResponse = {
    usuarioId: 1,
    nombre: 'Admin',
    email: 'admin@example.com',
    rolUsuario: 'ADMIN',
    empresaId: 4,
    empresaNombre: 'Empresa',
  };
  const proceso: Proceso = {
    id: 9,
    empresaId: 4,
    empresaNombre: 'Empresa',
    nombre: 'Proceso',
    descripcion: 'Descripción',
    categoria: 'Operaciones',
    estado: 'BORRADOR',
    activo: true,
    compartido: false,
    soloLectura: false,
  };

  let sesion: SesionResponse | null;
  let routeId: string | null;
  let procesoRespuesta: Proceso;
  let errorProceso: unknown | null;
  let navegacion: unknown[] | null;
  let busqueda: { id: number; empresaId: number } | null;

  beforeEach(async () => {
    sesion = sesionAdmin;
    routeId = '9';
    procesoRespuesta = proceso;
    errorProceso = null;
    navegacion = null;
    busqueda = null;

    await TestBed.configureTestingModule({
      imports: [BpmnEditorComponent],
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
            buscarPorId: (id: number, empresaId: number) => {
              busqueda = { id, empresaId };
              return errorProceso ? throwError(() => errorProceso) : of(procesoRespuesta);
            },
          },
        },
        { provide: ApiErrorService, useValue: { obtenerMensaje: () => 'No fue posible cargar el proceso.' } },
      ],
    })
      .overrideComponent(BpmnEditorComponent, { set: { template: '' } })
      .compileComponents();
  });

  function crearComponente(): BpmnEditorComponent {
    const fixture = TestBed.createComponent(BpmnEditorComponent);
    const componente = fixture.componentInstance;
    vi.spyOn(componente as any, 'inicializarEditor').mockImplementation(() => undefined);
    vi.spyOn(componente as any, 'cargarDiagrama').mockImplementation(() => undefined);
    fixture.detectChanges();
    return componente;
  }

  it('consulta el proceso usando la empresa de la sesión', () => {
    const componente = crearComponente();

    expect(busqueda).toEqual({ id: 9, empresaId: 4 });
    expect(componente.proceso).toEqual(proceso);
    expect(componente.puedeEditar).toBe(true);
  });

  it('abre el editor en solo lectura para el rol LECTURA', () => {
    sesion = { ...sesionAdmin, rolUsuario: 'LECTURA' };

    const componente = crearComponente();

    expect(componente.soloLectura).toBe(true);
    expect(componente.puedeEditar).toBe(false);
  });

  it('abre el editor en solo lectura cuando el proceso es compartido', () => {
    procesoRespuesta = { ...proceso, compartido: true, soloLectura: true };

    const componente = crearComponente();

    expect(componente.soloLectura).toBe(true);
    expect(componente.puedeEditar).toBe(false);
  });

  it('redirige al login cuando no existe sesión', () => {
    sesion = null;

    crearComponente();

    expect(navegacion).toEqual(['/login']);
    expect(busqueda).toBeNull();
  });

  it('redirige al listado cuando el identificador no es válido', () => {
    routeId = 'incorrecto';

    crearComponente();

    expect(navegacion).toEqual(['/procesos']);
    expect(busqueda).toBeNull();
  });

  it('muestra el error recibido al consultar el proceso', () => {
    errorProceso = new Error('fallo');

    const componente = crearComponente();

    expect(componente.error).toBe('No fue posible cargar el proceso.');
    expect(componente.cargando).toBe(false);
  });
});
