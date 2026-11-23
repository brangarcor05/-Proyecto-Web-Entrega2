import { TestBed } from '@angular/core/testing';
import { CambioRol, TarjetaUsuarioComponent } from './Tarjeta-Usuario.component';
import { Usuario } from '../../../models/usuario/usuario.model';
import { usuarioEditor } from '../../../testing/datos-prueba';

describe('TarjetaUsuarioComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TarjetaUsuarioComponent] }));

  function crear(usuario: Usuario) {
    const fixture = TestBed.createComponent(TarjetaUsuarioComponent);
    fixture.componentRef.setInput('usuario', usuario); // así se pasa un input() desde un test
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el nombre, el correo y el estado', () => {
    const texto = (crear(usuarioEditor).nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Ana Ruiz');
    expect(texto).toContain('ana@acme.com');
    expect(texto).toContain('Activo');
  });

  it('emite cambiarRol con el usuario y el nuevo rol', () => {
    const fixture = crear(usuarioEditor);
    let recibido: CambioRol | undefined;
    fixture.componentInstance.cambiarRol.subscribe(v => (recibido = v));

    fixture.componentInstance.onRolChange({ target: { value: 'ADMIN' } } as unknown as Event);

    expect(recibido).toEqual({ usuario: usuarioEditor, rolUsuario: 'ADMIN' });
  });

  it('emite desactivar al pulsar el botón', () => {
    const fixture = crear(usuarioEditor);
    let recibido: Usuario | undefined;
    fixture.componentInstance.desactivar.subscribe(v => (recibido = v));

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(recibido).toEqual(usuarioEditor);
  });

  it('oculta el botón de desactivar si el usuario ya está inactivo', () => {
    const fixture = crear({ ...usuarioEditor, activo: false });
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Inactivo');
  });
});
