import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GatewayService } from '../../../../services/gateway/gateway.service';
import { LaneService } from '../../../../services/lane/lane.service';
import { Lane } from '../../../../models/bpmn/lane/lane.model';
import { PoolService } from '../../../../services/pool/pool.service';
import { Pool } from '../../../../models/pool/pool.model';
import { TipoGateway } from '../../../../models/bpmn/gateway/gateway.model';

@Component({
    selector: 'app-gateway-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './gatewayForm.component.html',
    styleUrl: './gatewayForm.component.css'
})
export class GatewayFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private gatewayService = inject(GatewayService);
    private poolService = inject(PoolService);
    private laneService = inject(LaneService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    procesoId!: number;
    gatewayId?: number;
    isEditMode = false;

    pools = signal<Pool[]>([]);
    lanes = signal<Lane[]>([]);
    tiposGateway: TipoGateway[] = ['EXCLUSIVO', 'PARALELO', 'INCLUSIVO'];

    formulario: FormGroup = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        tipo: ['EXCLUSIVO', [Validators.required]],
        poolId: [null, [Validators.required]],
        laneId: [null, [Validators.required]]
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
            this.gatewayId = +idParam;
            this.cargarGateway(this.gatewayId);
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

    cargarGateway(id: number): void {
        this.gatewayService.obtenerPorId(id).subscribe({
            next: (data) => {
                this.formulario.patchValue(data);
                if (data.poolId) {
                    this.cargarLanesPorPool(data.poolId);
                }
            },
            error: (err) => console.error('Error al cargar el gateway', err)
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

        if (this.isEditMode && this.gatewayId) {
            this.gatewayService.actualizar(this.gatewayId, formData).subscribe({
                next: () => this.volverAlListado(),
                error: (err) => console.error('Error al actualizar gateway', err)
            });
        } else {
            this.gatewayService.crear(formData).subscribe({
                next: () => this.volverAlListado(),
                error: (err) => console.error('Error al crear gateway', err)
            });
        }
    }

    volverAlListado(): void {
        this.router.navigate(['/procesos', this.procesoId, 'gateways']);
    }
}