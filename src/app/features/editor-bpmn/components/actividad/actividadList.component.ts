import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ActividadService } from '../../../../services/actividad/actividad.service';
import { Actividad } from '../../../../models/bpmn/actividad/actividad.model';

@Component({
    selector: 'app-actividad-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './actividadList.component.html',
    styleUrl: './actividadList.component.css'
})
export class ActividadListComponent implements OnInit {
    private actividadService = inject(ActividadService);
    private route = inject(ActivatedRoute);

    actividades = signal<Actividad[]>([]);
    status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
    errorMessage = signal<string>('');

    procesoId!: number;

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const idParam = params.get('procesoId');
            if (idParam) {
                this.procesoId = +idParam;
                this.cargarActividades();
            }
        });
    }

    cargarActividades(): void {
        this.status.set('loading');
        this.actividadService.listarPorProceso(this.procesoId).subscribe({
            next: (data: Actividad[]) => {
                this.actividades.set(data);
                this.status.set('success');
            },
            error: (err: HttpErrorResponse) => {
                const errorMsg = err.error && typeof err.error === 'object' && 'message' in err.error
                    ? (err.error as any).message
                    : 'No fue posible cargar las actividades.';
                this.errorMessage.set(errorMsg);
                this.status.set('error');
            }
        });
    }
}