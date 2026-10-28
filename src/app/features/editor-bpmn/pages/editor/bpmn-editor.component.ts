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
import { AutenticacionService } from '../../../../services/auth/auth.service';
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

  private readonly procesoService = inject(ProcesoService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
   private readonly eventoService = inject(EventoService);
    private readonly poolService = inject(PoolService);

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
    const elementRegistry = this.modeler.get('elementRegistry') as any;
    const elementos = elementRegistry.getAll();
    
    // Filtramos solo los eventos de BPMN
    const eventosCanvas = elementos.filter((el: any) => 
      el.type === 'bpmn:StartEvent' || el.type === 'bpmn:EndEvent'
    );

    if (eventosCanvas.length === 0) {
      this.finalizarGuardado();
      return;
    }

    // Obtenemos los pools del proceso para asignar el pool propietario
    this.poolService.listarPorProceso(this.procesoId!).subscribe({
      next: (pools) => {
        const poolPropietario = pools.find(p => p.esPropietario);
        if (!poolPropietario) {
          this.finalizarGuardado();
          return;
        }

        let pendientes = eventosCanvas.length;

        eventosCanvas.forEach((eventoCanvas: any) => {
          const canvasId = eventoCanvas.id;
          const nombre = eventoCanvas.businessObject.name || 
            (eventoCanvas.type === 'bpmn:StartEvent' ? 'Inicio' : 'Fin');
          const tipo = eventoCanvas.type === 'bpmn:StartEvent' ? 'INICIO' : 'FIN';

          // Verificamos si ya existe en la BD
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
                    if (pendientes === 0) this.finalizarGuardado();
                  },
                  error: (err) => {
                    console.error('Error al crear evento', err);
                    pendientes--;
                    if (pendientes === 0) this.finalizarGuardado();
                  }
                });
              } else {
                pendientes--;
                if (pendientes === 0) this.finalizarGuardado();
              }
            },
            error: () => {
              pendientes--;
              if (pendientes === 0) this.finalizarGuardado();
            }
          });
        });
      },
      error: (err) => {
        this.guardando = false;
        this.apiErrorService.obtenerMensaje(err);
        this.cdr.markForCheck();
      }
    });
  }

  private finalizarGuardado(): void {
    this.guardando = false;
    this.mensaje = 'Diagrama y eventos guardados correctamente.';
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
  source?: ElementoBpmn;
  target?: ElementoBpmn;
  businessObject?: {
    $type?: string;
    name?: string;
    conditionExpression?: { body?: string };
  };
}
