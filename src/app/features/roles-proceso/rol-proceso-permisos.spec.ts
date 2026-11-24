import { puedeAdministrarRolesProceso } from './rol-proceso-permisos';

describe('rol-proceso-permisos', () => {
  it('permite administrar roles de proceso solo a ADMIN', () => {
    expect(puedeAdministrarRolesProceso('ADMIN')).toBe(true);
    expect(puedeAdministrarRolesProceso('EDITOR')).toBe(false);
    expect(puedeAdministrarRolesProceso('LECTURA')).toBe(false);
  });
});
