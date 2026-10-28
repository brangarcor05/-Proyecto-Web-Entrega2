import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MensajeEnvioService } from '../../../../services/mensajeEnvio/mensajeEnvio.service';
import { PoolService } from '../../../../services/pool/pool.service';
import { LaneService } from '../../../../services/lane/lane.service';
import { Pool } from '../../../../models/pool/pool.model';
import { Lane } from '../../../../models/bpmn/lane/lane.model';

@Component({
    selector: 'app-mensaje-envio-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './mensajeEnvioForm.component.html',
    styleUrl: './mensajeEnvioForm.component.css'
})
export class MensajeEnvioFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private mensajeEnvioService = inject(MensajeEnvioService);
    private poolService = inject(PoolService);
    private laneService = inject(LaneService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    procesoId!: number;
    mensajeId?: number;
    isEditMode = false;

    pools = signal<Pool[]>([]);
    lanes = signal<Lane[]>([]);

    formulario: FormGroup = this.fb.group({
        nombreMensaje: ['', [Validators.required, Validators.minLength(3)]],
        claveCorrelacion: [''],
        poolId: [null, [Validators.required]],
        laneId: [null, [Validators.required]],
        poolDestinoId: [null, [Validators.required]]
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
            this.mensajeId = +idParam;
            this.cargarMensajeEnvio(this.mensajeId);
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

    cargarMensajeEnvio(id: number): void {
        this.mensajeEnvioService.obtenerPorId(id).subscribe({
            next: (data) => {
                this.formulario.patchValue(data);
                if (data.poolId) {
                    this.cargarLanesPorPool(data.poolId);
                }
            },
            error: (err) => console.error('Error al cargar el mensaje de envío', err)
        });
    }

    guardar(): void {
        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            return;
        }

        const formData = {
            ...this.formulario.getRawValue(),
            procesoId: this.procesoId
        };

        if (this.isEditMode && this.mensajeId) {
            this.mensajeEnvioService.actualizar(this.mensajeId, formData).subscribe({
                next: () => this.volverAlListado(),
                error: (err) => console.error('Error al actualizar', err)
            });
        } else {
            this.mensajeEnvioService.crear(formData).subscribe({
                next: () => this.volverAlListado(),
                error: (err) => console.error('Error al crear', err)
            });
        }
    }

    volverAlListado(): void {
        this.router.navigate(['/procesos', this.procesoId, 'mensajes-envio']);
    }
}