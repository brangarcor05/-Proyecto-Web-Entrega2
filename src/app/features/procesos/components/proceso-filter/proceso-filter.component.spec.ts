import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProcesoFilterComponent } from './proceso-filter.component';
import { By } from '@angular/platform-browser';

describe('ProcesoFilterComponent', () => {
  let component: ProcesoFilterComponent;
  let fixture: ComponentFixture<ProcesoFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcesoFilterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcesoFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería emitir los filtros aplicados correctamente', () => {
    // Espiamos el EventEmitter
    const spy = vi.spyOn(component.buscar, 'emit');

    // Llenamos el formulario
    component.formulario.setValue({
      nombre: '  Vacaciones  ', // Con espacios para probar el trim
      estado: 'PUBLICADO',
      categoria: 'RRHH',
      incluirInactivos: true,
      sort: 'nombre,asc'
    });

    component.aplicar();

    expect(spy).toHaveBeenCalledWith({
      nombre: 'Vacaciones', // Debe venir sin espacios
      estado: 'PUBLICADO',
      categoria: 'RRHH',
      incluirInactivos: true,
      sort: 'nombre,asc'
    });
  });

  it('debería enviar undefined si los campos de texto están vacíos', () => {
    const spy = vi.spyOn(component.buscar, 'emit');

    component.formulario.setValue({
      nombre: '   ',
      estado: '',
      categoria: '',
      incluirInactivos: false,
      sort: 'id,asc'
    });

    component.aplicar();

    expect(spy).toHaveBeenCalledWith({
      nombre: undefined,
      estado: undefined,
      categoria: undefined,
      incluirInactivos: false,
      sort: 'id,asc'
    });
  });

  it('debería limpiar el formulario y emitir los valores por defecto', () => {
    const spy = vi.spyOn(component.buscar, 'emit');

    // Primero llenamos algo
    component.formulario.patchValue({ nombre: 'Test', estado: 'BORRADOR' });

    component.limpiar();

    expect(component.formulario.value).toEqual({
      nombre: '',
      estado: '',
      categoria: '',
      incluirInactivos: false,
      sort: 'id,asc'
    });
    expect(spy).toHaveBeenCalled(); // Debe emitir al limpiar
  });

  it('debería renderizar los inputs en el HTML', () => {
    const inputNombre = fixture.debugElement.query(By.css('input[formControlName="nombre"]'));
    const selectEstado = fixture.debugElement.query(By.css('select[formControlName="estado"]'));
    
    expect(inputNombre).toBeTruthy();
    expect(selectEstado).toBeTruthy();
  });
});