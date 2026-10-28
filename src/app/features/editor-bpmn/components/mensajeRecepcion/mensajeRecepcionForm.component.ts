import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MensajeRecepcionService } from '../../../../services/mensajeRecepcion/mensajeRecepcion.service';
import { PoolService } from '../../../../services/pool/pool.service';
import { LaneService } from '../../../../services/lane/lane.service';
import { Pool } from '../../../../models/pool/pool.model';
import { Lane } from '../../../../models/bpmn/lane/lane.model';
import { VarianteMensajeCatch } from '../../../../models/bpmn/mensajeRecepcion/mensajeRecepcion.model';

@Component({
    selector: 'app-mensaje-recepcion-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './mensajeRecepcionForm.component.html',
    styleUrl: './mensajeRecepcionForm.component.css'
})
export class MensajeRecepcionFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private mensajeRecepcionService = inject(MensajeRecepcionService);
    private poolService = inject(PoolService);
    private laneService = inject(LaneService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    procesoId!: number;
    mensajeId?: number;
    isEditMode = false;

    pools = signal<Pool[]>([]);
    lanes = signal<Lane[]>([]);
    variantes: VarianteMensajeCatch[] = ['INICIO', 'INTERMEDIO'];

    formulario: FormGroup = this.fb.group({
        nombreMensaje: ['', [Validators.required, Validators.minLength(3)]],
        variante: ['INICIO', [Validators.required]],
        poolId: [null, [Validators.required]],
        laneId: [null, [Validators.required]],
        datosEsperados: [''],
        origenExterno: [false],
        claveCorrelacion: ['']
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
            this.cargarMensajeRecepcion(this.mensajeId);
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

    cargarMensajeRecepcion(id: number): void {
        this.mensajeRecepcionService.obtenerPorId(id).subscribe({
            next: (data) => {
                this.formulario.patchValue(data);
                if (data.poolId) {
                    this.cargarLanesPorPool(data.poolId);
                }
            },
            error: (err) => console.error('Error al cargar el mensaje de recepción', err)
        });
    }

    guardar(): void {
        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            return;
        }

        const rawValue = this.formulario.getRawValue();
        const formData = {
            laneId: rawValue.laneId,
            poolId: rawValue.poolId,
            nombreMensaje: rawValue.nombreMensaje,
            variante: rawValue.variante,
            datosEsperados: rawValue.datosEsperados,
            origenExterno: rawValue.origenExterno,
            claveCorrelacion: rawValue.claveCorrelacion,
            procesoId: this.procesoId
        };

        if (this.isEditMode && this.mensajeId) {
            this.mensajeRecepcionService.actualizar(this.mensajeId, formData).subscribe({
                next: () => this.volverAlListado(),
                error: (err) => console.error('Error al actualizar', err)
            });
        } else {
            this.mensajeRecepcionService.crear(formData).subscribe({
                next: () => this.volverAlListado(),
                error: (err) => console.error('Error al crear', err)
            });
        }
    }

    volverAlListado(): void {
        this.router.navigate(['/procesos', this.procesoId, 'mensajes-recepcion']);
    }
}