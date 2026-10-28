import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';
import Canvas from 'diagram-js/lib/core/Canvas';
import CommandStack from 'diagram-js/lib/command/CommandStack';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { Proceso } from '../../../../models/proceso/proceso.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { ProcesoService } from '../../../../services/proceso/proceso.service';
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

  private editor: BpmnModeler | BpmnViewer | null = null;
  procesoId: number | null = null;
  proceso: Proceso | null = null;
  cargando = false;
  guardando = false;
  mensaje = '';
  error = '';
  soloLectura = true;

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
          this.proceso = proceso;
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

        this.editor?.importXML(xmlACargar).then(() => {
          this.ajustarVista();
          this.cdr.markForCheck();
        }).catch((error: unknown) => {
          this.error = this.apiErrorService.obtenerMensaje(error);
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.mensaje = 'El proceso todavía no tiene un diagrama guardado.';
        this.editor?.importXML(this.xmlVacio()).then(() => {
          this.ajustarVista();
          this.cdr.markForCheck();
        });
      },
    });
  }

  guardar(): void {
    const sesion = this.obtenerSesion();
    if (!sesion || !this.procesoId || !this.puedeEditar || !(this.editor instanceof BpmnModeler)) {
      return;
    }

    this.guardando = true;
    this.mensaje = '';
    this.cdr.markForCheck();

    this.editor.saveXML({ format: true }).then(({ xml }: { xml?: string }) => {
      if (!xml) return;

      this.procesoService.guardarDiagrama(this.procesoId!, xml, sesion.usuarioId)
        .pipe(finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        }))
        .subscribe({
          next: () => {
            this.mensaje = 'Diagrama guardado correctamente.';
            this.cdr.markForCheck();
          },
          error: (err) => {
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
    if (!this.puedeEditar || !(this.editor instanceof BpmnModeler)) return;
    const commandStack = this.editor.get('commandStack') as CommandStack;
    commandStack.undo();
  }

  rehacer(): void {
    if (!this.puedeEditar || !(this.editor instanceof BpmnModeler)) return;
    const commandStack = this.editor.get('commandStack') as CommandStack;
    commandStack.redo();
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
    this.editor?.destroy();
    this.editor = null;
  }

  private ajustarVista(): void {
    if (!this.editor) return;
    const canvas = this.editor.get('canvas') as Canvas;
    canvas.zoom('fit-viewport');
  }

  private obtenerSesion(): SesionResponse | null {
    const sesion = this.autenticacionService.sesion();
    if (!sesion) this.router.navigate(['/login']);
    return sesion;
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
