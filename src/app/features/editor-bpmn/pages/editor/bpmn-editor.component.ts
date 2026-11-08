import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';
import Canvas from 'diagram-js/lib/core/Canvas';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { ArcoDiagrama } from '../../../../models/arco/arco-diagrama.model';
import { SincronizarArcoRequest } from '../../../../models/arco/sincronizar-arco-request.model';
import { ArcoService } from '../../../../services/arco/arco.service';
import { ActividadService } from '../../../../services/actividad/actividad.service';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { GatewayService } from '../../../../services/gateway/gateway.service';
import { LaneService } from '../../../../services/lane/lane.service';
import { ProcesoService } from '../../../../services/proceso/proceso.service';
import { EventoService } from '../../../../services/evento/evento.service';
import { PoolService } from '../../../../services/pool/pool.service';
import { puedeCrearOEditarProceso } from '../../../procesos/proceso-permisos';
import { ArcoPanelComponent } from '../../components/arco/arco-panel.component';

@Component({
  selector: 'app-bpmn-editor',
  imports: [CommonModule, RouterLink, ArcoPanelComponent],
  templateUrl: './bpmn-editor.component.html',
  styleUrl: './bpmn-editor.component.css',
})
export class BpmnEditorComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;
  @ViewChild('propertiesContainer', { static: true }) propertiesContainer!: ElementRef;
  @ViewChild(ArcoPanelComponent) arcoPanel?: ArcoPanelComponent;

  private readonly procesoService = inject(ProcesoService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly eventoService = inject(EventoService);
  private readonly poolService = inject(PoolService);
  private readonly arcoService = inject(ArcoService);
  private readonly gatewayService = inject(GatewayService);
  private readonly actividadService = inject(ActividadService);
  private readonly laneService = inject(LaneService);

  private editor: BpmnModeler | BpmnViewer | null = null;
  private eventBus: EventBusBpmn | null = null;
  private readonly alCambiarDiagrama = () => {
    this.actualizarArcosDiagrama();
    this.actualizarEstadoHistorial();
  };
  procesoId: number | null = null;
  cargando = false;
  guardando = false;
  mensaje = '';
  error = '';
  soloLectura = true;
  readonly arcosDiagrama = signal<ArcoDiagrama[]>([]);
  readonly puedeDeshacer = signal(false);
  readonly puedeRehacer = signal(false);

  get puedeEditar(): boolean {
    return !this.soloLectura;
  }

  ngOnInit(): void {
    const sesion = this.obtenerSesion();
    if (!sesion) return;

    const id = Number(this.route.snapshot.paramMap.get('procesoId'));
    if (!Number.isInteger(id) || id <= 0) {
      this.router.navigate(['/procesos']);
      return;
    }
    this.procesoId = id;
    this.cargarProceso(id, sesion);
  }

  private cargarProceso(procesoId: number, sesion: SesionResponse): void {
    this.cargando = true;
    this.error = '';
    this.procesoService.buscarPorId(procesoId, sesion.empresaId)
      .pipe(finalize(() => {
        this.cargando = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (proceso) => {
          this.soloLectura = proceso.soloLectura
            || !puedeCrearOEditarProceso(sesion.rolUsuario);
          this.inicializarEditor();
          this.cargarDiagrama(procesoId, sesion.empresaId);
        },
        error: (error: unknown) => {
          this.error = this.apiErrorService.obtenerMensaje(error);
          this.cdr.markForCheck();
        },
      });
  }

  private inicializarEditor(): void {
    if (this.editor) {
      this.editor.destroy();
    }

    if (this.soloLectura) {
      this.editor = new BpmnViewer({
        container: this.canvasContainer.nativeElement,
      });
      return;
    }

    this.editor = new BpmnModeler({
      container: this.canvasContainer.nativeElement,
      propertiesPanel: {
        parent: this.propertiesContainer.nativeElement,
      },
      additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
      ],
    });
    this.suscribirCambiosDiagrama();
  }

  private cargarDiagrama(procesoId: number, empresaId: number): void {
    if (!this.editor) return;

    this.procesoService.obtenerDiagrama(procesoId, empresaId).subscribe({
      next: (xml) => {
        const esValido = xml && xml.includes('<bpmndi:BPMNDiagram');
        const xmlACargar = esValido ? xml : this.xmlVacio();

        if (!esValido) {
          this.mensaje = 'El proceso todavía no tiene un diagrama guardado.';
        }

        this.importarXml(xmlACargar);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.mensaje = 'El proceso todavía no tiene un diagrama guardado.';
          this.importarXml(this.xmlVacio());
          return;
        }

        this.error = this.apiErrorService.obtenerMensaje(error);
        this.cdr.markForCheck();
      },
    });
  }

    guardar(): void {
    const sesion = this.obtenerSesion();
    if (!sesion || !this.procesoId || !this.puedeEditar || !(this.editor instanceof BpmnModeler)) {
      return;
    }

    this.guardando = true;
    this.mensaje = 'Guardando diagrama...';
    this.cdr.markForCheck();

    this.editor.saveXML({ format: true }).then(({ xml }: { xml?: string }) => {
      if (!xml) {
        this.guardando = false;
        this.error = 'No fue posible generar el XML del diagrama.';
        this.cdr.markForCheck();
        return;
      }

      this.procesoService.guardarDiagrama(this.procesoId!, xml, sesion.usuarioId)
        .subscribe({
          next: () => {
            // 2. Sincronizamos los eventos del canvas con la base de datos
            this.sincronizarEventos(sesion);
          },
          error: (err) => {
            this.guardando = false;
            this.mensaje = '';
            this.apiErrorService.obtenerMensaje(err);
            this.error = this.apiErrorService.obtenerMensaje(err);
            this.cdr.markForCheck();
          },
        });
    }).catch((error: unknown) => {
      this.guardando = false;
      this.error = this.apiErrorService.obtenerMensaje(error);
      this.cdr.markForCheck();
    });
  }

  deshacer(): void {
    if (!this.puedeEditar || !this.editor) return;
    const commandStack = this.editor.get('commandStack') as HistorialComandos;
    if (!commandStack.canUndo()) return;
    commandStack.undo();
    this.actualizarEstadoHistorial();
  }

  rehacer(): void {
    if (!this.puedeEditar || !this.editor) return;
    const commandStack = this.editor.get('commandStack') as HistorialComandos;
    if (!commandStack.canRedo()) return;
    commandStack.redo();
    this.actualizarEstadoHistorial();
  }

  eliminarSeleccion(): void {
    if (!this.puedeEditar || !this.editor) return;
    const editorActions = this.editor.get('editorActions') as AccionesEditorBpmn;
    editorActions.trigger('removeSelection');
  }

  zoomIn(): void {
    if (!this.editor) return;
    const canvas = this.editor.get('canvas') as Canvas;
    const currentZoom = canvas.zoom();
    canvas.zoom(currentZoom + 0.1);
  }

  zoomOut(): void {
    if (!this.editor) return;
    const canvas = this.editor.get('canvas') as Canvas;
    const currentZoom = canvas.zoom();
    canvas.zoom(Math.max(currentZoom - 0.1, 0.2));
  }

  ngOnDestroy(): void {
    this.eventBus?.off('commandStack.changed', this.alCambiarDiagrama);
    this.eventBus = null;
    this.editor?.destroy();
    this.editor = null;
  }

  private ajustarVista(): void {
    if (!this.editor) return;
    const canvas = this.editor.get('canvas') as Canvas;
    canvas.zoom('fit-viewport');
  }

  private importarXml(xml: string): void {
    this.editor?.importXML(xml).then(() => {
      this.ajustarVista();
      this.actualizarArcosDiagrama();
      this.cdr.markForCheck();
    }).catch((error: unknown) => {
      this.error = this.apiErrorService.obtenerMensaje(error);
      this.cdr.markForCheck();
    });
  }

  private suscribirCambiosDiagrama(): void {
    if (!(this.editor instanceof BpmnModeler)) return;
    this.eventBus = this.editor.get('eventBus') as EventBusBpmn;
    this.eventBus.on('commandStack.changed', this.alCambiarDiagrama);
    this.actualizarEstadoHistorial();
  }

  private actualizarEstadoHistorial(): void {
    if (!this.editor || !this.puedeEditar) {
      this.puedeDeshacer.set(false);
      this.puedeRehacer.set(false);
      return;
    }

    const commandStack = this.editor.get('commandStack') as HistorialComandos;
    this.puedeDeshacer.set(commandStack.canUndo());
    this.puedeRehacer.set(commandStack.canRedo());
    this.cdr.markForCheck();
  }

  private actualizarArcosDiagrama(): void {
    if (!this.editor) return;
    const registro = this.editor.get('elementRegistry') as ElementRegistryBpmn;
    const arcos = registro.getAll()
      .filter((elemento) => elemento.type === 'bpmn:SequenceFlow'
        || elemento.businessObject?.$type === 'bpmn:SequenceFlow')
      .map((elemento): ArcoDiagrama => ({
        id: elemento.id,
        origenId: elemento.source?.id ?? '',
        origenNombre: this.obtenerNombreElemento(elemento.source),
        destinoId: elemento.target?.id ?? '',
        destinoNombre: this.obtenerNombreElemento(elemento.target),
        etiqueta: elemento.businessObject?.name ?? null,
        condicion: elemento.businessObject?.conditionExpression?.body ?? null,
      }));
    this.arcosDiagrama.set(arcos);
    this.cdr.markForCheck();
  }

  private obtenerNombreElemento(elemento?: ElementoBpmn): string {
    return elemento?.businessObject?.name || elemento?.id || 'Elemento sin nombre';
  }

  private obtenerSesion(): SesionResponse | null {
    const sesion = this.autenticacionService.sesion();
    if (!sesion) this.router.navigate(['/login']);
    return sesion;
  }
  private sincronizarEventos(sesion: SesionResponse): void {
    if (!this.editor) {
      this.sincronizarGateways(sesion);
      return;
    }

    // 1. Obtenemos el registro de elementos con el tipo correcto
    const elementRegistry = this.editor.get('elementRegistry') as ElementRegistryBpmn;
    const elementos = elementRegistry.getAll();
    
    // 2. Filtramos solo los eventos (StartEvent y EndEvent)
    const eventosCanvas = elementos.filter(
      (el: ElementoBpmn) => el.type === 'bpmn:StartEvent' || el.type === 'bpmn:EndEvent'
    );

    if (eventosCanvas.length === 0) {
      this.sincronizarGateways(sesion);
      return;
    }

    // 3. Obtenemos los pools del proceso
    this.poolService.listarPorProceso(this.procesoId!).subscribe({
      next: (pools) => {
        const poolPropietario = pools.find(p => p.esPropietario);
        if (!poolPropietario) {
          this.finalizarConError('El proceso no tiene un pool propietario para sincronizar sus nodos.');
          return;
        }

        let pendientes = eventosCanvas.length;

        eventosCanvas.forEach((eventoCanvas: ElementoBpmn) => {
          const canvasId = eventoCanvas.id;
          
          const nombre = eventoCanvas.businessObject?.name || 
            (eventoCanvas.type === 'bpmn:StartEvent' ? 'Inicio' : 'Fin');
          const tipo = eventoCanvas.type === 'bpmn:StartEvent' ? 'INICIO' : 'FIN';

          
          this.eventoService.listarPorProceso(this.procesoId!).subscribe({
            next: (eventosBD) => {
              const existe = eventosBD.find(e => e.canvasId === canvasId);
              
              if (!existe) {
                const request = {
                  procesoId: this.procesoId!,
                  poolId: poolPropietario.id,
                  nombre: nombre,
                  tipo: tipo as 'INICIO' | 'FIN',
                  canvasId: canvasId,
                };
                this.eventoService.crear(request, sesion.usuarioId).subscribe({
                  next: () => {
                    pendientes--;
                    if (pendientes === 0) this.sincronizarGateways(sesion);
                  },
                  error: (err: unknown) => {
                    this.finalizarConError(this.apiErrorService.obtenerMensaje(err));
                  }
                });
              } else {
                pendientes--;
                if (pendientes === 0) this.sincronizarGateways(sesion);
              }
            },
            error: (err: unknown) => {
              this.finalizarConError(this.apiErrorService.obtenerMensaje(err));
            }
          });
        });
      },
      error: (err: unknown) => {
        this.finalizarConError(this.apiErrorService.obtenerMensaje(err));
      }
    });
  }

  private sincronizarGateways(sesion: SesionResponse): void {
    if (!this.editor || !this.procesoId) {
      this.finalizarConError('No fue posible identificar el proceso del diagrama.');
      return;
    }

    const registro = this.editor.get('elementRegistry') as ElementRegistryBpmn;
    const gatewaysCanvas = registro.getAll().filter((elemento) =>
      ['bpmn:ExclusiveGateway', 'bpmn:ParallelGateway', 'bpmn:InclusiveGateway']
        .includes(elemento.type),
    );

    if (gatewaysCanvas.length === 0) {
      this.sincronizarActividades(sesion);
      return;
    }

    this.poolService.listarPorProceso(this.procesoId).subscribe({
      next: (pools) => {
        const pool = pools.find((actual) => actual.esPropietario);
        if (!pool) {
          this.finalizarConError('El proceso no tiene un pool propietario para sincronizar sus gateways.');
          return;
        }

        this.gatewayService.listarPorProceso(this.procesoId!).subscribe({
          next: (guardados) => {
            let pendientes = gatewaysCanvas.length;
            gatewaysCanvas.forEach((elemento) => {
              const existente = guardados.find((gateway) => gateway.canvasId === elemento.id);
              const request = {
                procesoId: this.procesoId!,
                poolId: pool.id,
                nombre: this.obtenerNombreElemento(elemento),
                tipo: this.obtenerTipoGateway(elemento.type),
                posicionX: elemento.x ?? 0,
                posicionY: elemento.y ?? 0,
                canvasId: elemento.id,
              };
              const operacion = existente
                ? this.gatewayService.actualizar(existente.id, request)
                : this.gatewayService.crear(request);
              operacion.subscribe({
                next: () => {
                  pendientes--;
                  if (pendientes === 0) this.sincronizarActividades(sesion);
                },
                error: (error: unknown) =>
                  this.finalizarConError(this.apiErrorService.obtenerMensaje(error)),
              });
            });
          },
          error: (error: unknown) =>
            this.finalizarConError(this.apiErrorService.obtenerMensaje(error)),
        });
      },
      error: (error: unknown) =>
        this.finalizarConError(this.apiErrorService.obtenerMensaje(error)),
    });
  }

  private sincronizarActividades(sesion: SesionResponse): void {
    if (!this.editor || !this.procesoId) {
      this.finalizarConError('No fue posible identificar el proceso del diagrama.');
      return;
    }

    const registro = this.editor.get('elementRegistry') as ElementRegistryBpmn;
    const actividadesCanvas = registro.getAll().filter((elemento) =>
      ['bpmn:Task', 'bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ManualTask',
        'bpmn:ScriptTask', 'bpmn:BusinessRuleTask', 'bpmn:SendTask', 'bpmn:ReceiveTask']
        .includes(elemento.type),
    );

    if (actividadesCanvas.length === 0) {
      this.sincronizarArcos(sesion);
      return;
    }

    this.poolService.listarPorProceso(this.procesoId).subscribe({
      next: (pools) => {
        const pool = pools.find((actual) => actual.esPropietario);
        if (!pool) {
          this.finalizarConError('El proceso no tiene un pool propietario para sincronizar sus actividades.');
          return;
        }

        this.laneService.listarPorPool(pool.id).subscribe({
          next: (lanes) => {
            const lane = lanes.find((actual) => actual.activo);
            if (!lane) {
              this.finalizarConError('El pool propietario necesita al menos una lane para sincronizar actividades.');
              return;
            }

            this.actividadService.listarPorProceso(this.procesoId!).subscribe({
              next: (guardadas) => {
                let pendientes = actividadesCanvas.length;
                actividadesCanvas.forEach((elemento) => {
                  const existente = guardadas.find((actividad) => actividad.canvasId === elemento.id);
                  const request = {
                    procesoId: this.procesoId!,
                    poolId: pool.id,
                    laneId: lane.id,
                    nombre: this.obtenerNombreElemento(elemento),
                    tipo: this.obtenerTipoActividad(elemento.type),
                    posicionX: elemento.x ?? 0,
                    posicionY: elemento.y ?? 0,
                    canvasId: elemento.id,
                  };
                  const operacion = existente
                    ? this.actividadService.actualizar(existente.id, request)
                    : this.actividadService.crear(request);
                  operacion.subscribe({
                    next: () => {
                      pendientes--;
                      if (pendientes === 0) this.sincronizarArcos(sesion);
                    },
                    error: (error: unknown) =>
                      this.finalizarConError(this.apiErrorService.obtenerMensaje(error)),
                  });
                });
              },
              error: (error: unknown) =>
                this.finalizarConError(this.apiErrorService.obtenerMensaje(error)),
            });
          },
          error: (error: unknown) =>
            this.finalizarConError(this.apiErrorService.obtenerMensaje(error)),
        });
      },
      error: (error: unknown) =>
        this.finalizarConError(this.apiErrorService.obtenerMensaje(error)),
    });
  }

  private obtenerTipoGateway(tipoBpmn: string): 'EXCLUSIVO' | 'PARALELO' | 'INCLUSIVO' {
    if (tipoBpmn === 'bpmn:ParallelGateway') return 'PARALELO';
    if (tipoBpmn === 'bpmn:InclusiveGateway') return 'INCLUSIVO';
    return 'EXCLUSIVO';
  }

  private obtenerTipoActividad(tipoBpmn: string): string {
    return tipoBpmn.replace('bpmn:', '').replace('Task', '').toUpperCase() || 'TAREA';
  }

  private sincronizarArcos(sesion: SesionResponse): void {
    if (!this.procesoId) {
      this.finalizarConError('No fue posible identificar el proceso del diagrama.');
      return;
    }

    const solicitudes: SincronizarArcoRequest[] = this.arcosDiagrama().map((arco) => ({
      canvasId: arco.id,
      origenCanvasId: arco.origenId,
      destinoCanvasId: arco.destinoId,
      etiqueta: arco.etiqueta,
      condicion: arco.condicion,
    }));

    this.arcoService.sincronizar(this.procesoId, solicitudes, sesion.usuarioId).subscribe({
      next: () => {
        this.arcoPanel?.recargar();
        this.finalizarGuardado();
      },
      error: (error: unknown) => {
        this.finalizarConError(this.apiErrorService.obtenerMensaje(error));
      },
    });
  }

  private finalizarGuardado(): void {
    this.guardando = false;
    this.error = '';
    this.mensaje = 'Diagrama, eventos y arcos guardados correctamente.';
    this.cdr.markForCheck();
  }

  private finalizarConError(mensaje: string): void {
    this.guardando = false;
    this.mensaje = '';
    this.error = mensaje;
    this.cdr.markForCheck();
  }

  private xmlVacio(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="99" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  }
}

interface EventBusBpmn {
  on(evento: string, callback: (evento: never) => void): void;
  off(evento: string, callback: (evento: never) => void): void;
}

interface AccionesEditorBpmn {
  trigger(accion: 'removeSelection'): void;
}

interface HistorialComandos {
  canUndo(): boolean;
  canRedo(): boolean;
  undo(): void;
  redo(): void;
}

interface ElementRegistryBpmn {
  getAll(): ElementoBpmn[];
}

interface ElementoBpmn {
  id: string;
  type: string;
  x?: number;
  y?: number;
  source?: ElementoBpmn;
  target?: ElementoBpmn;
  businessObject?: {
    $type?: string;
    name?: string;
    conditionExpression?: { body?: string };
  };
}
