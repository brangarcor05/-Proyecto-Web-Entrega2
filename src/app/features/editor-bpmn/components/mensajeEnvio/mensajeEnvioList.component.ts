import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MensajeEnvioService } from '../../../../services/mensajeEnvio/mensajeEnvio.service';
import { MensajeEnvio } from '../../../../models/bpmn/mensajeEnvio/mensajeEnvio.model';

@Component({
    selector: 'app-mensaje-envio-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './mensajeEnvioList.component.html',
    styleUrl: './mensajeEnvioList.component.css'
})
export class MensajeEnvioListComponent implements OnInit {
    private mensajeEnvioService = inject(MensajeEnvioService);
    private route = inject(ActivatedRoute);

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
                const errorMsg = err.error && typeof err.error === 'object' && 'message' in err.error
                    ? (err.error as any).message
                    : 'No fue posible cargar los mensajes de envío.';
                this.errorMessage.set(errorMsg);
                this.status.set('error');
            }
        });
    }
}