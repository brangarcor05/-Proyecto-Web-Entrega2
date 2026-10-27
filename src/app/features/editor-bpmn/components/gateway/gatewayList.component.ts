import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { GatewayService } from '../../../../services/gateway/gateway.service';
import { Gateway } from '../../../../models/bpmn/gateway/gateway.model';

@Component({
    selector: 'app-gateway-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './gatewayList.component.html',
    styleUrl: './gatewayList.component.css'
})
export class GatewayListComponent implements OnInit {
    private gatewayService = inject(GatewayService);
    private route = inject(ActivatedRoute);

    gateways = signal<Gateway[]>([]);
    status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
    errorMessage = signal<string>('');

    procesoId!: number;

    ngOnInit(): void {
        // Captura dinámica del parámetro procesoId desde la ruta activa
        this.route.paramMap.subscribe(params => {
            const idParam = params.get('procesoId');
            if (idParam) {
                this.procesoId = +idParam;
                this.cargarGateways();
            }
        });
    }

    cargarGateways(): void {
        this.status.set('loading');
        this.gatewayService.listarPorProceso(this.procesoId).subscribe({
            next: (data: Gateway[]) => {
                this.gateways.set(data);
                this.status.set('success');
            },
            error: (err: HttpErrorResponse) => {
                // Se maneja de forma segura el mensaje de error tipando err como HttpErrorResponse
                const errorMsg = err.error && typeof err.error === 'object' && 'message' in err.error
                    ? (err.error as any).message
                    : 'No fue posible cargar los gateways.';
                this.errorMessage.set(errorMsg);
                this.status.set('error');
            }
        });
    }
}