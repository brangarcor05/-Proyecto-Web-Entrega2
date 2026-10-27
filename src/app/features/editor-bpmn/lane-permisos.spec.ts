import { puedeCrearOEditarLane, puedeEliminarLane } from './lane-permisos';

describe('lane-permisos', () => {
  it('permite crear/editar lanes a ADMIN y EDITOR, no a LECTURA', () => {
    expect(puedeCrearOEditarLane('ADMIN')).toBe(true);
    expect(puedeCrearOEditarLane('EDITOR')).toBe(true);
    expect(puedeCrearOEditarLane('LECTURA')).toBe(false);
  });

  it('permite eliminar lanes solo a ADMIN', () => {
    expect(puedeEliminarLane('ADMIN')).toBe(true);
    expect(puedeEliminarLane('EDITOR')).toBe(false);
    expect(puedeEliminarLane('LECTURA')).toBe(false);
  });
});
