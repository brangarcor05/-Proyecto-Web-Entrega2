import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
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

interface EditorBpmnSimulado {
  destroy(): void;
  importXML?(xml: string): Promise<void>;
  get?(servicio: string): unknown;
}

interface BpmnEditorComponentePrueba {
  editor: EditorBpmnSimulado | null;
  inicializarEditor(): void;
  cargarDiagrama(procesoId: number, empresaId: number): void;
  actualizarArcosDiagrama(): void;
}

function accederMetodosPrivados(
  componente: BpmnEditorComponent,
): BpmnEditorComponentePrueba {
  return componente as unknown as BpmnEditorComponentePrueba;
}

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
  let diagramaRespuesta: string;
  let errorDiagrama: unknown | null;

  beforeEach(async () => {
    sesion = sesionAdmin;
    routeId = '9';
    procesoRespuesta = proceso;
    errorProceso = null;
    navegacion = null;
    busqueda = null;
    diagramaRespuesta = '<bpmndi:BPMNDiagram />';
    errorDiagrama = null;

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
            obtenerDiagrama: () => errorDiagrama
              ? throwError(() => errorDiagrama)
              : of(diagramaRespuesta),
          },
        },
        { provide: ApiErrorService, useValue: { obtenerMensaje: () => 'No fue posible cargar el proceso.' } },
      ],
    })
      .overrideComponent(BpmnEditorComponent, { set: { template: '' } })
      .compileComponents();
  });

  function crearComponente(simularCargaDiagrama = true): BpmnEditorComponent {
    const fixture = TestBed.createComponent(BpmnEditorComponent);
    const componente = fixture.componentInstance;
    const componentePrueba = accederMetodosPrivados(componente);
    vi.spyOn(componentePrueba, 'inicializarEditor').mockImplementation(() => undefined);
    if (simularCargaDiagrama) {
      vi.spyOn(componentePrueba, 'cargarDiagrama').mockImplementation(() => undefined);
    }
    fixture.detectChanges();
    return componente;
  }

  it('consulta el proceso usando la empresa de la sesión', () => {
    const componente = crearComponente();

    expect(busqueda).toEqual({ id: 9, empresaId: 4 });
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

  it('traduce los flujos de secuencia del lienzo para el panel de Arcos', () => {
    const componente = crearComponente();
    const componentePrueba = accederMetodosPrivados(componente);
    componentePrueba.editor = {
      destroy: () => undefined,
      get: () => ({
        getAll: () => [{
          id: 'Flow_1',
          type: 'bpmn:SequenceFlow',
          source: { id: 'Start_1', type: 'bpmn:StartEvent', businessObject: { name: 'Inicio' } },
          target: { id: 'Task_1', type: 'bpmn:Task', businessObject: { name: 'Revisar' } },
          businessObject: { name: 'Continuar' },
        }],
      }),
    };

    componentePrueba.actualizarArcosDiagrama();

    expect(componente.arcosDiagrama()).toEqual([{
      id: 'Flow_1',
      origenId: 'Start_1',
      origenNombre: 'Inicio',
      destinoId: 'Task_1',
      destinoNombre: 'Revisar',
      etiqueta: 'Continuar',
      condicion: null,
    }]);
  });

  it('reconoce un flujo por el tipo semántico entregado por bpmn-js', () => {
    const componente = crearComponente();
    const componentePrueba = accederMetodosPrivados(componente);
    componentePrueba.editor = {
      destroy: () => undefined,
      get: () => ({
        getAll: () => [{
          id: 'Flow_semantico',
          source: { id: 'Start_1', businessObject: { name: 'Inicio' } },
          target: { id: 'Task_1', businessObject: { name: 'Revisar' } },
          businessObject: { $type: 'bpmn:SequenceFlow' },
        }],
      }),
    };

    componentePrueba.actualizarArcosDiagrama();

    expect(componente.arcosDiagrama()).toHaveLength(1);
    expect(componente.arcosDiagrama()[0].id).toBe('Flow_semantico');
  });

  it('crea un diagrama vacío solamente cuando el backend responde 404', () => {
    const componente = crearComponente(false);
    const componentePrueba = accederMetodosPrivados(componente);
    const importarXml = vi.fn().mockResolvedValue(undefined);
    componentePrueba.editor = { importXML: importarXml, destroy: () => undefined };
    errorDiagrama = new HttpErrorResponse({ status: 404 });

    componentePrueba.cargarDiagrama(9, 4);

    expect(importarXml).toHaveBeenCalledOnce();
    expect(componente.mensaje).toBe('El proceso todavía no tiene un diagrama guardado.');
    expect(componente.error).toBe('');
  });

  it('presenta el error y conserva el editor cuando falla la carga con un estado distinto de 404', () => {
    const componente = crearComponente(false);
    const componentePrueba = accederMetodosPrivados(componente);
    const importarXml = vi.fn().mockResolvedValue(undefined);
    componentePrueba.editor = { importXML: importarXml, destroy: () => undefined };
    errorDiagrama = new HttpErrorResponse({ status: 500 });

    componentePrueba.cargarDiagrama(9, 4);

    expect(importarXml).not.toHaveBeenCalled();
    expect(componente.mensaje).toBe('');
    expect(componente.error).toBe('No fue posible cargar el proceso.');
  });

  it('deshace y habilita rehacer según el historial real de bpmn-js', () => {
    const componente = crearComponente();
    const componentePrueba = accederMetodosPrivados(componente);
    const undo = vi.fn();
    const historial = {
      canUndo: () => true,
      canRedo: () => true,
      undo,
      redo: vi.fn(),
    };
    componentePrueba.editor = {
      destroy: () => undefined,
      get: () => historial,
    };

    componente.deshacer();

    expect(undo).toHaveBeenCalledOnce();
    expect(componente.puedeDeshacer()).toBe(true);
    expect(componente.puedeRehacer()).toBe(true);
  });

  it('rehace una acción solamente cuando existe en el historial', () => {
    const componente = crearComponente();
    const componentePrueba = accederMetodosPrivados(componente);
    const redo = vi.fn();
    let hayAccionRehacible = true;
    const historial = {
      canUndo: () => false,
      canRedo: () => hayAccionRehacible,
      undo: vi.fn(),
      redo: () => {
        redo();
        hayAccionRehacible = false;
      },
    };
    componentePrueba.editor = {
      destroy: () => undefined,
      get: () => historial,
    };

    componente.rehacer();
    componente.rehacer();

    expect(redo).toHaveBeenCalledOnce();
    expect(componente.puedeRehacer()).toBe(false);
  });

  it('elimina la selección utilizando la acción oficial de bpmn-js', () => {
    const componente = crearComponente();
    const componentePrueba = accederMetodosPrivados(componente);
    const trigger = vi.fn();
    componentePrueba.editor = {
      destroy: () => undefined,
      get: () => ({ trigger }),
    };

    componente.eliminarSeleccion();

    expect(trigger).toHaveBeenCalledWith('removeSelection');
  });
});
