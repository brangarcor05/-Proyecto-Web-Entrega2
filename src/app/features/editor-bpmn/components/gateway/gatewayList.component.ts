import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { GatewayService } from '../../../../services/gateway/gateway.service';
import { Gateway } from '../../../../models/bpmn/gateway/gateway.model';

@Component({
    selector: 'app-gateway-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './gatewayList.component.html',
    styleUrl: './gatewayList.component.css'
})
export class GatewayListComponent implements OnInit {
    private gatewayService = inject(GatewayService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    gateways = signal<Gateway[]>([]);
    status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
    errorMessage = signal<string>('');

    procesoId!: number;

    ngOnInit(): void {
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
                const errorBody = err.error as { message?: string } | null;
                const errorMsg = errorBody && typeof errorBody === 'object' && 'message' in errorBody && typeof errorBody.message === 'string'
                    ? errorBody.message
                    : 'No fue posible cargar los gateways.';
                this.errorMessage.set(errorMsg);
                this.status.set('error');
            }
        });
    }

    eliminar(id: number): void {
        if (confirm('¿Estás seguro de eliminar este gateway?')) {
            this.gatewayService.eliminar(id).subscribe({
                next: () => this.cargarGateways(),
                error: (err: HttpErrorResponse) => console.error('Error al eliminar gateway', err)
            });
        }
    }

    irANuevo(): void {
        this.router.navigate(['/procesos', this.procesoId, 'gateways', 'nuevo']);
    }

    irAEditar(id: number): void {
        this.router.navigate(['/procesos', this.procesoId, 'gateways', id, 'editar']);
    }
}