import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MensajeEnvioService } from '../../../../services/mensajeEnvio/mensajeEnvio.service';
import { MensajeEnvio } from '../../../../models/bpmn/mensajeEnvio/mensajeEnvio.model';

@Component({
    selector: 'app-mensaje-envio-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './mensajeEnvioList.component.html',
    styleUrl: './mensajeEnvioList.component.css'
})
export class MensajeEnvioListComponent implements OnInit {
    private mensajeEnvioService = inject(MensajeEnvioService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    mensajesEnvio = signal<MensajeEnvio[]>([]);
    status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
    errorMessage = signal<string>('');

    procesoId!: number;

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const idParam = params.get('procesoId');
            if (idParam) {
                this.procesoId = +idParam;
                this.cargarMensajesEnvio();
            }
        });
    }

    cargarMensajesEnvio(): void {
        this.status.set('loading');
        this.mensajeEnvioService.listarPorProceso(this.procesoId).subscribe({
            next: (data: MensajeEnvio[]) => {
                this.mensajesEnvio.set(data);
                this.status.set('success');
            },
            error: (err: HttpErrorResponse) => {
                const errorBody = err.error as { message?: string } | null;
                const errorMsg = errorBody && typeof errorBody === 'object' && 'message' in errorBody && typeof errorBody.message === 'string'
                    ? errorBody.message
                    : 'No fue posible cargar los mensajes de envío.';
                this.errorMessage.set(errorMsg);
                this.status.set('error');
            }
        });
    }

    eliminar(id: number): void {
        if (confirm('¿Estás seguro de eliminar este mensaje de envío?')) {
            this.mensajeEnvioService.eliminar(id).subscribe({
                next: () => this.cargarMensajesEnvio(),
                error: (err: HttpErrorResponse) => console.error('Error al eliminar mensaje de envío', err)
            });
        }
    }

    irANuevo(): void {
        this.router.navigate(['/procesos', this.procesoId, 'mensajes-envio', 'nuevo']);
    }

    irAEditar(id: number): void {
        this.router.navigate(['/procesos', this.procesoId, 'mensajes-envio', id, 'editar']);
    }
}