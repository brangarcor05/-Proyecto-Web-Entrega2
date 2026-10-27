import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SesionResponse } from '../../models/auth/auth.model';
import { Proceso } from '../../models/proceso/proceso.model';
import { AutenticacionService } from '../../services/auth/auth.service';
import { ProcesoListComponent } from './pages/proceso-list/proceso-list.component';
import { ProcesoDetailComponent } from './pages/proceso-detail/proceso-detail.component';

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
});
