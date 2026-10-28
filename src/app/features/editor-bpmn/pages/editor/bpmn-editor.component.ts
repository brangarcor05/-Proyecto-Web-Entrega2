import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import Canvas from 'diagram-js/lib/core/Canvas';
import CommandStack from 'diagram-js/lib/command/CommandStack';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { ProcesoService } from '../../../../services/proceso/proceso.service';
import { EventoService } from '../../../../services/evento/evento.service';
import { PoolService } from '../../../../services/pool/pool.service';

@Component({
  selector: 'app-bpmn-editor',
  imports: [CommonModule, RouterLink],
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

  private modeler!: BpmnModeler;
  procesoId: number | null = null;
  guardando = false;
  mensaje = '';

  ngOnInit(): void {
    const sesion = this.obtenerSesion();
    if (!sesion) return;

    const id = Number(this.route.snapshot.paramMap.get('procesoId'));
    if (!Number.isInteger(id) || id <= 0) {
      this.router.navigate(['/procesos']);
      return;
    }
    this.procesoId = id;

    // 1. Inicializar el Modeler de BPMN
    this.modeler = new BpmnModeler({
      container: this.canvasContainer.nativeElement,
      propertiesPanel: {
        parent: this.propertiesContainer.nativeElement,
      },
      additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
      ],
    });

    // 2. Cargar el XML del backend
    this.cargarDiagrama(id, sesion.empresaId);
  }

    private cargarDiagrama(procesoId: number, empresaId: number): void {
    this.procesoService.obtenerDiagrama(procesoId, empresaId).subscribe({
      next: (xml) => {
        // Verificamos si el XML del backend es válido (tiene la parte visual)
        const esValido = xml && xml.includes('<bpmndi:BPMNDiagram');
        const xmlACargar = esValido ? xml : this.xmlVacio();

        if (!esValido) {
          console.warn('El XML del backend está incompleto. Cargando diagrama vacío.');
        }

        this.modeler.importXML(xmlACargar).then(() => {
          this.cdr.markForCheck();
        }).catch((err) => {
          console.error('Error al importar XML', err);
          // Si falla incluso el vacío, mostramos el error
          this.apiErrorService.obtenerMensaje(err);
        });
      },
      error: (err) => {
        console.warn('No se pudo obtener el XML del backend. Cargando vacío.');
        this.modeler.importXML(this.xmlVacio());
      },
    });
  }

    guardar(): void {
    const sesion = this.obtenerSesion();
    if (!sesion || !this.procesoId) return;

    this.guardando = true;
    this.mensaje = 'Guardando diagrama...';
    this.cdr.markForCheck();

    this.modeler.saveXML({ format: true }).then(({ xml }) => {
      if (!xml) return;

      // 1. Guardamos el XML en el backend
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
            this.cdr.markForCheck();
          },
        });
    });
  }

  deshacer(): void {
    const commandStack = this.modeler.get('commandStack') as CommandStack;
    commandStack.undo();
  }

  rehacer(): void {
    const commandStack = this.modeler.get('commandStack') as CommandStack;
    commandStack.redo();
  }

    zoomIn(): void {
    const canvas = this.modeler.get('canvas') as Canvas;
    const currentZoom = canvas.zoom(); // Obtiene el nivel actual (ej: 1)
    canvas.zoom(currentZoom + 0.1);    // Aumenta un 10%
  }

  zoomOut(): void {
    const canvas = this.modeler.get('canvas') as Canvas;
    const currentZoom = canvas.zoom();
    canvas.zoom(currentZoom - 0.1);    // Disminuye un 10%
  }

  ngOnDestroy(): void {
    if (this.modeler) this.modeler.destroy();
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