import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MensajeRecepcionService } from '../../../../services/mensajeRecepcion/mensajeRecepcion.service';
import { MensajeRecepcion } from '../../../../models/bpmn/mensajeRecepcion/mensajeRecepcion.model';

@Component({
    selector: 'app-mensaje-recepcion-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './mensajeRecepcionList.component.html',
    styleUrl: './mensajeRecepcionList.component.css'
})
export class MensajeRecepcionListComponent implements OnInit {
    private mensajeRecepcionService = inject(MensajeRecepcionService);
    private route = inject(ActivatedRoute);

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
                const errorMsg = err.error && typeof err.error === 'object' && 'message' in err.error
                    ? (err.error as any).message
                    : 'No fue posible cargar los mensajes de recepción.';
                this.errorMessage.set(errorMsg);
                this.status.set('error');
            }
        });
    }
}