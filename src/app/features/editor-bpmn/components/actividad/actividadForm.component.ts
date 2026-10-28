import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { ActividadService } from '../../../../services/actividad/actividad.service';
import { LaneService } from '../../../../services/lane/lane.service';
import { Lane } from '../../../../models/bpmn/lane/lane.model';
import { PoolService } from '../../../../services/pool/pool.service';
import { Pool } from '../../../../models/pool/pool.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';

@Component({
    selector: 'app-actividad-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './actividadForm.component.html',
    styleUrl: './actividadForm.component.css'
})
export class ActividadFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private actividadService = inject(ActividadService);
    private poolService = inject(PoolService);
    private laneService = inject(LaneService);
    private autenticacionService = inject(AutenticacionService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    procesoId!: number;
    actividadId?: number;
    isEditMode = false;

    pools = signal<Pool[]>([]);
    lanes = signal<Lane[]>([]);

    formulario: FormGroup = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        poolId: [null, [Validators.required]],
        laneId: [null, [Validators.required]],
        tipo: [''],
        descripcion: ['']
    });

    ngOnInit(): void {
        this.procesoId = +this.route.snapshot.paramMap.get('procesoId')!;
        const idParam = this.route.snapshot.paramMap.get('id');

        this.cargarPools();

        this.formulario.get('poolId')?.valueChanges.subscribe((poolIdValue) => {
            if (poolIdValue) {
                this.cargarLanesPorPool(+poolIdValue);
            } else {
                this.lanes.set([]);
                this.formulario.get('laneId')?.setValue(null);
            }
        });

        if (idParam) {
            this.isEditMode = true;
            this.actividadId = +idParam;
            this.cargarActividad(this.actividadId);
        }
    }

    cargarPools(): void {
        this.poolService.listarPorProceso(this.procesoId).subscribe({
            next: (data: Pool[]) => this.pools.set(data),
            error: (err) => console.error('Error al cargar pools', err)
        });
    }

    cargarLanesPorPool(poolId: number): void {
        this.laneService.listarPorPool(poolId).subscribe({
            next: (data: Lane[]) => this.lanes.set(data),
            error: (err) => console.error('Error al cargar lanes', err)
        });
    }

    cargarActividad(id: number): void {
        this.actividadService.obtenerPorId(id).subscribe({
            next: (data) => {
                this.formulario.patchValue(data);
                if (data.poolId) {
                    this.cargarLanesPorPool(data.poolId);
                }
            },
            error: (err) => console.error('Error al cargar la actividad', err)
        });
    }

    guardar(): void {
        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            return;
        }

        const sesion = this.autenticacionService.sesion();
        if (!sesion) {
            console.error('No hay una sesión activa.');
            return;
        }

        const rawValues = this.formulario.getRawValue();

        const formData = {
            nombre: rawValues.nombre,
            tipo: rawValues.tipo,
            descripcion: rawValues.descripcion,
            procesoId: Number(this.procesoId),
            poolId: Number(rawValues.poolId),
            laneId: Number(rawValues.laneId)
        };

        if (this.isEditMode && this.actividadId) {
            this.actividadService.actualizar(this.actividadId, formData).subscribe({
                next: () => this.volverAlListado(),
                error: (err) => console.error('Error al actualizar', err)
            });
        } else {
            this.actividadService.crear(formData).subscribe({
                next: () => this.volverAlListado(),
                error: (err) => console.error('Error al crear', err)
            });
        }
    }

    volverAlListado(): void {
        this.router.navigate(['/procesos', this.procesoId, 'actividades']);
    }
}