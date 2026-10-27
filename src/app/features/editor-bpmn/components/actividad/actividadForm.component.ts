import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ActividadService } from '../../../../services/actividad/actividad.service';

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
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    procesoId!: number;
    actividadId?: number;
    isEditMode = false;

    formulario: FormGroup = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        laneId: [null, [Validators.required]],
        poolId: [null],
        tipo: [''],
        descripcion: ['']
    });

    ngOnInit(): void {
        this.procesoId = +this.route.snapshot.paramMap.get('procesoId')!;
        const idParam = this.route.snapshot.paramMap.get('id');

        if (idParam) {
            this.isEditMode = true;
            this.actividadId = +idParam;
            this.cargarActividad(this.actividadId);
        }
    }

    cargarActividad(id: number): void {
        this.actividadService.obtenerPorId(id).subscribe({
            next: (data) => {
                this.formulario.patchValue(data);
            },
            error: (err) => console.error('Error al cargar la actividad', err)
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