import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActividadService } from '../../../../services/actividad/actividad.service';
import { Actividad } from '../../../../models/bpmn/actividad/actividad.model';

@Component({
    selector: 'app-actividad-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './actividadList.component.html',
    styleUrl: './actividadList.component.css'
})
export class ActividadListComponent implements OnInit {
    private actividadService = inject(ActividadService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    procesoId!: number;
    actividades = signal<Actividad[]>([]);

    ngOnInit(): void {
        this.procesoId = +this.route.snapshot.paramMap.get('procesoId')!;
        this.cargarActividades();
    }

    cargarActividades(): void {
        this.actividadService.listarPorProceso(this.procesoId).subscribe({
            next: (data) => this.actividades.set(data),
            error: (err) => console.error('Error al cargar actividades', err)
        });
    }

    eliminar(id: number): void {
        if (confirm('¿Estás seguro de eliminar esta actividad?')) {
            this.actividadService.eliminar(id).subscribe({
                next: () => this.cargarActividades(),
                error: (err) => console.error('Error al eliminar', err)
            });
        }
    }

    irANueva(): void {
        this.router.navigate(['/procesos', this.procesoId, 'actividades', 'nuevo']);
    }

    irAEditar(id: number): void {
        this.router.navigate(['/procesos', this.procesoId, 'actividades', id, 'editar']);
    }
}