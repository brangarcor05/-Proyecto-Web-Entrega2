import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GatewayService } from '../../../../services/gateway/gateway.service';

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
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    procesoId!: number;
    gatewayId?: number;
    isEditMode = false;

    formulario: FormGroup = this.fb.group({
        nombre: [''],
        tipo: ['', [Validators.required]],
        laneId: [null, [Validators.required]],
        poolId: [null]
    });

    ngOnInit(): void {
        this.procesoId = +this.route.snapshot.paramMap.get('procesoId')!;
        const idParam = this.route.snapshot.paramMap.get('id');

        if (idParam) {
            this.isEditMode = true;
            this.gatewayId = +idParam;
            this.cargarGateway(this.gatewayId);
        }
    }

    cargarGateway(id: number): void {
        this.gatewayService.obtenerPorId(id).subscribe({
            next: (data) => this.formulario.patchValue(data),
            error: (err) => console.error('Error al cargar gateway', err)
        });
    }

    guardar(): void {
        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            return;
        }

        const formData = {
            ...this.formulario.value,
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