import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SesionResponse } from '../../models/auth/auth.model';
import { Proceso } from '../../models/proceso/proceso.model';
import { Historial } from '../../models/proceso/historial.model';
import { AutenticacionService } from '../../services/auth/auth.service';
import { ProcesoListComponent } from './pages/proceso-list/proceso-list.component';
import { ProcesoDetailComponent } from './pages/proceso-detail/proceso-detail.component';
import { ProcesoFormComponent } from './pages/proceso-form/proceso-form.component';
import { ProcesoHistoryComponent } from './pages/proceso-history/proceso-history.component';
import { ProcesoShareComponent } from './pages/proceso-share/proceso-share.component';

describe('Navegacion de procesos hacia el diagrama', () => {
  const proceso: Proceso = {
    id: 42,
    empresaId: 23,
    empresaNombre: 'Empresa',
    nombre: 'Proceso seleccionado',
    descripcion: 'Descripcion',
    categoria: 'Pruebas',
    estado: 'BORRADOR',
    activo: true,
    compartido: false,
    soloLectura: false,
  };
  let http: HttpTestingController;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'procesos', component: ProcesoListComponent },
          { path: 'procesos/:id/editar', component: ProcesoFormComponent },
          { path: 'procesos/:id/historial', component: ProcesoHistoryComponent },
          { path: 'procesos/:id/compartir', component: ProcesoShareComponent },
          { path: 'procesos/:id', component: ProcesoDetailComponent },
        ]),
        {
          provide: AutenticacionService,
          useValue: {
            sesion: signal<SesionResponse | null>({
              usuarioId: 17,
              empresaId: 23,
              nombre: 'Juliana',
              email: 'juliana@example.test',
              rolUsuario: 'ADMIN',
              empresaNombre: 'Empresa',
            }),
          },
        },
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
    }
  });

  it('retira el estado de carga al recibir los procesos sin otra interaccion del usuario', async () => {
    await harness.navigateByUrl('/procesos');
    http
      .expectOne((request) => request.url === '/api/procesos')
      .flush({
        content: [proceso],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 9,
        first: true,
        last: true,
        empty: false,
        numberOfElements: 1,
      });
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).toContain('Proceso seleccionado');
    expect(harness.routeNativeElement?.textContent).not.toContain('Cargando procesos');
  });

  it('muestra los accesos a eventos y notificaciones al recibir el detalle', async () => {
    await harness.navigateByUrl('/procesos/42');
    http.expectOne('/api/procesos/42?empresaId=23').flush(proceso);
    await harness.fixture.whenStable();
    expect(
      harness.routeNativeElement?.querySelector('a[href="/procesos/42/eventos"]'),
    ).not.toBeNull();
    expect(
      harness.routeNativeElement?.querySelector('a[href="/procesos/42/notificaciones"]'),
    ).not.toBeNull();
    expect(harness.routeNativeElement?.textContent).not.toContain('Cargando proceso');
  });

  it('muestra el historial al recibir la respuesta sin requerir otra navegacion', async () => {
    const historial: Historial[] = [{
      id: 1,
      entidadTipo: 'PROCESO',
      entidadId: 42,
      accion: 'CREACION',
      detalle: 'Proceso creado',
      fecha: '2026-10-27T10:00:00',
      usuarioId: 17,
      usuarioNombre: 'Juliana',
    }];

    await harness.navigateByUrl('/procesos/42/historial');
    http.expectOne('/api/procesos/42/historial?empresaId=23').flush(historial);
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.textContent).toContain('Proceso creado');
    expect(harness.routeNativeElement?.textContent).not.toContain('Cargando historial');
  });

  it('muestra el formulario editado al recibir el proceso sin requerir otra navegacion', async () => {
    await harness.navigateByUrl('/procesos/42/editar');
    http.expectOne('/api/procesos/42?empresaId=23').flush(proceso);
    await harness.fixture.whenStable();

    const nombre = harness.routeNativeElement?.querySelector<HTMLInputElement>(
      'input[formControlName="nombre"]',
    );
    expect(nombre?.value).toBe('Proceso seleccionado');
    expect(harness.routeNativeElement?.textContent).not.toContain(
      'Cargando información del proceso',
    );
  });

  it('muestra el proceso y las empresas al compartir sin requerir otra navegacion', async () => {
    await harness.navigateByUrl('/procesos/42/compartir');
    http.expectOne('/api/empresas').flush([
      {
        id: 23,
        nombre: 'Empresa',
        rut: '900000001',
        razonSocial: 'Empresa actual',
        email: 'actual@example.com',
        estado: 'ACTIVO',
        fechaRegistro: '2026-10-27T10:00:00',
        adminUsuarioId: 17,
      },
      {
        id: 24,
        nombre: 'Empresa invitada',
        rut: '900000002',
        razonSocial: 'Empresa invitada',
        email: 'invitada@example.com',
        estado: 'ACTIVO',
        fechaRegistro: '2026-10-27T10:00:00',
        adminUsuarioId: 18,
      },
    ]);
    http.expectOne('/api/procesos/42?empresaId=23').flush({
      ...proceso,
      compartido: true,
      empresasCompartidasIds: [24],
    });
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.textContent).toContain('Proceso seleccionado');
    expect(harness.routeNativeElement?.textContent).toContain('Empresa invitada');
    expect(harness.routeNativeElement?.textContent).not.toContain('Cargando proceso');
    expect(harness.routeNativeElement?.textContent).not.toContain('Cargando empresas');
  });
});
