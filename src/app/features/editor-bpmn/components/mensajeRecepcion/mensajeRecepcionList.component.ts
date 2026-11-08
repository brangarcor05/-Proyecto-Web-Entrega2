import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MensajeRecepcionService } from '../../../../services/mensajeRecepcion/mensajeRecepcion.service';
import { MensajeRecepcion } from '../../../../models/bpmn/mensajeRecepcion/mensajeRecepcion.model';

@Component({
    selector: 'app-mensaje-recepcion-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './mensajeRecepcionList.component.html',
    styleUrl: './mensajeRecepcionList.component.css'
})
export class MensajeRecepcionListComponent implements OnInit {
    private mensajeRecepcionService = inject(MensajeRecepcionService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    mensajesRecepcion = signal<MensajeRecepcion[]>([]);
    status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
    errorMessage = signal<string>('');

    procesoId!: number;

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const idParam = params.get('procesoId');
            if (idParam) {
                this.procesoId = +idParam;
                this.cargarMensajesRecepcion();
            }
        });
    }

    cargarMensajesRecepcion(): void {
        this.status.set('loading');
        this.mensajeRecepcionService.listarPorProceso(this.procesoId).subscribe({
            next: (data: MensajeRecepcion[]) => {
                this.mensajesRecepcion.set(data);
                this.status.set('success');
            },
            error: (err: HttpErrorResponse) => {
                const errorBody = err.error as { message?: string } | null;
                const errorMsg = errorBody && typeof errorBody === 'object' && 'message' in errorBody && typeof errorBody.message === 'string'
                    ? errorBody.message
                    : 'No fue posible cargar los mensajes de recepción.';
                this.errorMessage.set(errorMsg);
                this.status.set('error');
            }
        });
    }

    eliminar(id: number): void {
        if (confirm('¿Estás seguro de eliminar este mensaje de recepción?')) {
            this.mensajeRecepcionService.eliminar(id).subscribe({
                next: () => this.cargarMensajesRecepcion(),
                error: (err: HttpErrorResponse) => console.error('Error al eliminar mensaje de recepción', err)
            });
        }
    }

    irANuevo(): void {
        this.router.navigate(['/procesos', this.procesoId, 'mensajes-recepcion', 'nuevo']);
    }

    irAEditar(id: number): void {
        this.router.navigate(['/procesos', this.procesoId, 'mensajes-recepcion', id, 'editar']);
    }
}