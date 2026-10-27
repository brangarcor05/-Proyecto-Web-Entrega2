import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SesionResponse } from '../../models/auth/auth.model';
import { Proceso } from '../../models/proceso/proceso.model';
import { Evento } from '../../models/evento/evento.model';
import { AutenticacionService } from '../../services/auth/auth.service';
import { EventoListComponent } from './pages/evento-list/evento-list.component';
import { EventoDetailComponent } from './pages/evento-detail/evento-detail.component';
import { EventoFormComponent } from './components/evento-form/evento-form.component';

@Component({ template: '' })
class DestinoComponent {}

describe('Recorrido de Evento', () => {
  const sesionInicial: SesionResponse = {
    usuarioId: 17,
    empresaId: 23,
    nombre: 'Juliana',
    email: 'juliana@example.test',
    rolUsuario: 'ADMIN',
    empresaNombre: 'Empresa',
  };
  const proceso: Proceso = {
    id: 42,
    empresaId: 23,
    empresaNombre: 'Empresa',
    nombre: 'Proceso seleccionado',
    descripcion: '',
    categoria: 'Pruebas',
    estado: 'BORRADOR',
    activo: true,
    compartido: false,
    soloLectura: false,
  };
  const elemento: Evento = {
    id: 81,
    procesoId: 42,
    poolId: 51,
    nombre: 'Elemento de prueba',
    activo: true,
    posicionX: 0,
    posicionY: null,
    tipo: 'INICIO',
  };
  const sesion = signal<SesionResponse | null>(null);
  let http: HttpTestingController;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    sesion.set(sesionInicial);
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AutenticacionService, useValue: { sesion } },
        provideRouter([
          { path: 'login', component: DestinoComponent },
          { path: 'procesos/:procesoId/eventos/nuevo', component: EventoFormComponent },
          { path: 'procesos/:procesoId/eventos/:id/editar', component: EventoFormComponent },
          { path: 'procesos/:procesoId/eventos/:id', component: EventoDetailComponent },
          { path: 'procesos/:procesoId/eventos', component: EventoListComponent },
        ]),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    try {
      http.verify();
    } finally {
      TestBed.resetTestingModule();
      vi.restoreAllMocks();
    }
  });

  function cargarProceso(soloLectura = false) {
    http.expectOne('/api/procesos/42?empresaId=23').flush({ ...proceso, soloLectura });
  }

  async function listado(soloLectura = false) {
    const component = await harness.navigateByUrl('/procesos/42/eventos', EventoListComponent);
    cargarProceso(soloLectura);
    return component;
  }

  async function formulario(edicion = false) {
    const component = await harness.navigateByUrl(
      edicion ? '/procesos/42/eventos/81/editar' : '/procesos/42/eventos/nuevo',
      EventoFormComponent,
    );
    cargarProceso();
    http.expectOne('/api/pools?procesoId=42').flush([
      { id: 51, procesoId: 42, nombre: 'Origen', cajaNegra: false, activo: true },
      { id: 52, procesoId: 42, nombre: 'Externo', cajaNegra: true, activo: true },
      { id: 53, procesoId: 99, nombre: 'Otro proceso', cajaNegra: false, activo: true },
      { id: 54, procesoId: 42, nombre: 'Inactivo', cajaNegra: false, activo: false },
    ]);

    if (edicion) http.expectOne('/api/eventos/81').flush(elemento);
    harness.detectChanges();
    return component;
  }

  function completar(component: EventoFormComponent) {
    component.formulario.patchValue({
      nombre: 'Nuevo elemento',
      poolId: 51,
      posicionX: 0,
      tipo: 'FIN',
    });
  }

  it('muestra carga y usa el proceso de la ruta', async () => {
    const component = await listado();
    harness.detectChanges();
    expect(component.cargando).toBe(true);
    expect(harness.routeNativeElement?.textContent).toContain('Cargando');
    http.expectOne('/api/eventos?procesoId=42').flush([elemento]);
    harness.detectChanges();
    expect(component.cargando).toBe(false);
    expect(harness.routeNativeElement?.textContent).toContain('Elemento de prueba');
  });

  it('muestra el estado vacio', async () => {
    await listado();
    http.expectOne('/api/eventos?procesoId=42').flush([]);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Todavía no hay');
  });

  it('muestra el mensaje real del backend cuando falla la consulta', async () => {
    await listado();
    http
      .expectOne('/api/eventos?procesoId=42')
      .flush({ mensaje: 'Consulta no permitida' }, { status: 403, statusText: 'Forbidden' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'Consulta no permitida',
    );
  });

  it.each(['ADMIN', 'EDITOR', 'LECTURA'] as const)(
    'aplica los permisos visuales del rol %s',
    async (rol) => {
      sesion.set({ ...sesionInicial, rolUsuario: rol });
      await listado();
      http.expectOne('/api/eventos?procesoId=42').flush([elemento]);
      harness.detectChanges();
      expect(!!harness.routeNativeElement?.querySelector('[data-testid="crear"]')).toBe(
        rol !== 'LECTURA',
      );
      expect(!!harness.routeNativeElement?.querySelector('[data-testid="editar"]')).toBe(
        rol !== 'LECTURA',
      );
      expect(!!harness.routeNativeElement?.querySelector('[data-testid="eliminar"]')).toBe(
        rol === 'ADMIN',
      );
    },
  );

  it('no permite modificar un proceso compartido de solo lectura', async () => {
    const component = await listado(true);
    http.expectOne('/api/eventos?procesoId=42').flush([elemento]);
    harness.detectChanges();
    expect(component.puedeEditar).toBe(false);
    expect(harness.routeNativeElement?.querySelector('[data-testid="crear"]')).toBeNull();
    component.eliminar(elemento);
    http.expectNone((request) => request.method === 'DELETE');
  });

  it('elimina con el usuario de la sesion y actualiza el listado', async () => {
    const component = await listado();
    http.expectOne('/api/eventos?procesoId=42').flush([elemento]);
    component.eliminar(elemento);
    component.confirmarEliminacion();
    const req = http.expectOne('/api/eventos/81?usuarioId=17');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(component.elementos).toEqual([]);
    vi.restoreAllMocks();
  });

  it('solicita confirmacion en pantalla antes de enviar la eliminacion', async () => {
    await listado();
    http.expectOne('/api/eventos?procesoId=42').flush([elemento]);
    harness.detectChanges();
    const eliminar = harness.routeNativeElement?.querySelector(
      '[data-testid="eliminar"]',
    ) as HTMLButtonElement;
    eliminar.click();
    harness.detectChanges();
    const dialogo = harness.routeNativeElement?.querySelector('dialog');
    expect(dialogo?.textContent).toContain('Confirmar eliminación');
    http.expectNone((request) => request.method === 'DELETE');
    const confirmar = dialogo?.querySelector('button') as HTMLButtonElement;
    confirmar.click();
    http
      .expectOne('/api/eventos/81?usuarioId=17')
      .flush(null, { status: 204, statusText: 'No Content' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('dialog')).toBeNull();
  });

  it('conserva el listado si se cancela la eliminacion', async () => {
    const component = await listado();
    http.expectOne('/api/eventos?procesoId=42').flush([elemento]);
    component.eliminar(elemento);
    component.cancelarEliminacion();
    expect(component.elementos).toHaveLength(1);
    http.expectNone((request) => request.method === 'DELETE');
    vi.restoreAllMocks();
  });

  it('conserva el elemento y muestra errores al fallar la eliminacion', async () => {
    const component = await listado();
    http.expectOne('/api/eventos?procesoId=42').flush([elemento]);
    component.eliminar(elemento);
    component.confirmarEliminacion();
    http
      .expectOne('/api/eventos/81?usuarioId=17')
      .flush({ mensaje: 'No puedes eliminar' }, { status: 403, statusText: 'Forbidden' });
    expect(component.error).toBe('No puedes eliminar');
    expect(component.elementos).toHaveLength(1);
    expect(component.eliminando).toBe(false);
    vi.restoreAllMocks();
  });

  it('redirige al login sin sesion y no consulta el backend', async () => {
    sesion.set(null);
    await harness.navigateByUrl('/procesos/42/eventos');
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/login');
    http.expectNone((request) => request.url.startsWith('/api'));
  });

  it('rechaza identificadores invalidos de la ruta', async () => {
    const component = await harness.navigateByUrl(
      '/procesos/invalido/eventos',
      EventoListComponent,
    );
    expect(component.error).toContain('no es válido');
    http.expectNone((request) => request.url.startsWith('/api'));
  });

  it('rechaza formularios vacios, nombres en blanco y coordenadas no finitas', async () => {
    const component = await formulario();
    component.guardar();
    expect(component.formulario.invalid).toBe(true);
    completar(component);
    component.formulario.controls.nombre.setValue('   ');
    expect(component.formulario.invalid).toBe(true);
    component.formulario.controls.nombre.setValue('Valido');
    component.formulario.controls.posicionX.setValue(Number.POSITIVE_INFINITY);
    component.guardar();
    http.expectNone((request) => request.method === 'POST');
  });

  it('solo ofrece pools activos del proceso y con el tipo correcto', async () => {
    const component = await formulario();
    expect(component.pools.map((pool) => pool.id)).toEqual([51]);

    completar(component);
    component.formulario.controls.poolId.setValue(53);
    component.guardar();
    expect(component.error).toContain('pools activos');
    http.expectNone((request) => request.method === 'POST');
  });

  it('crea con proceso y usuario reales y navega al detalle', async () => {
    const component = await formulario();
    completar(component);
    component.guardar();
    const req = http.expectOne('/api/eventos?usuarioId=17');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.procesoId).toBe(42);
    expect(req.request.body.poolId).toBe(51);
    expect(req.request.body.posicionX).toBe(0);
    req.flush(elemento, { status: 201, statusText: 'Created' });
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/procesos/42/eventos/81');
    cargarProceso();
    http.expectOne('/api/eventos/81').flush(elemento);
  });

  it('carga la edicion y actualiza sin cambiar proceso ni pool de origen', async () => {
    const component = await formulario(true);
    expect(component.formulario.controls.poolId.disabled).toBe(true);
    component.formulario.controls.nombre.setValue('Actualizado');
    component.guardar();
    const req = http.expectOne('/api/eventos/81?usuarioId=17');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.nombre).toBe('Actualizado');
    expect(req.request.body.procesoId).toBeUndefined();
    expect(req.request.body.poolId).toBeUndefined();
    req.flush(null, { status: 500, statusText: 'Server Error' });
  });

  it('muestra errores de validacion enviados por el backend', async () => {
    const component = await formulario();
    completar(component);
    component.guardar();
    http
      .expectOne('/api/eventos?usuarioId=17')
      .flush(
        { mensaje: 'Datos invalidos', camposInvalidos: { nombre: 'Nombre repetido' } },
        { status: 400, statusText: 'Bad Request' },
      );
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Nombre repetido');
    expect(component.guardando).toBe(false);
  });

  it('impide guardar desde una ruta de formulario con rol LECTURA', async () => {
    sesion.set({ ...sesionInicial, rolUsuario: 'LECTURA' });
    const component = await formulario();
    expect(component.formulario.disabled).toBe(true);
    component.guardar();
    http.expectNone((request) => request.method === 'POST');
  });

  it('rechaza nombres de mas de 150 caracteres', async () => {
    const component = await formulario();
    completar(component);
    component.formulario.controls.nombre.setValue('X'.repeat(151));
    component.guardar();
    expect(component.formulario.controls.nombre.invalid).toBe(true);
    http.expectNone((request) => request.method === 'POST');
  });

  it('actualiza la consulta al cambiar el proceso de la ruta', async () => {
    const component = await listado();
    http.expectOne('/api/eventos?procesoId=42').flush([elemento]);
    await harness.navigateByUrl('/procesos/43/eventos');
    http.expectOne('/api/procesos/43?empresaId=23').flush({ ...proceso, id: 43 });
    http.expectOne('/api/eventos?procesoId=43').flush([]);
    expect(component.procesoId).toBe(43);
    expect(component.elementos).toEqual([]);
  });

  it('consulta el detalle del elemento seleccionado', async () => {
    const component = await harness.navigateByUrl('/procesos/42/eventos/81', EventoDetailComponent);
    cargarProceso();
    http.expectOne('/api/eventos/81').flush(elemento);
    harness.detectChanges();
    expect(component.elemento?.id).toBe(81);
    expect(harness.routeNativeElement?.textContent).toContain('Elemento de prueba');
  });

  it('rechaza un elemento de otro proceso en el detalle', async () => {
    const component = await harness.navigateByUrl('/procesos/42/eventos/81', EventoDetailComponent);
    cargarProceso();
    http.expectOne('/api/eventos/81').flush({ ...elemento, procesoId: 99 });
    expect(component.elemento).toBeNull();
    expect(component.error).not.toBe('');
  });
});
