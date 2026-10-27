# Eventos y notificaciones externas

## Acceso

Desde el detalle de un proceso se accede a Eventos y Notificaciones externas.
Ambas secciones permiten listar, consultar el detalle, crear, editar y desactivar elementos.

| Sección        | Listado                             | Crear                                     | Detalle                                 | Editar                                         |
| -------------- | ----------------------------------- | ----------------------------------------- | --------------------------------------- | ---------------------------------------------- |
| Eventos        | /procesos/:procesoId/eventos        | /procesos/:procesoId/eventos/nuevo        | /procesos/:procesoId/eventos/:id        | /procesos/:procesoId/eventos/:id/editar        |
| Notificaciones | /procesos/:procesoId/notificaciones | /procesos/:procesoId/notificaciones/nuevo | /procesos/:procesoId/notificaciones/:id | /procesos/:procesoId/notificaciones/:id/editar |

El proceso se obtiene de ActivatedRoute y se consulta con la empresa de la sesión.
El usuario de las operaciones de escritura se toma de AutenticacionService.sesion().
Al recargar sin una sesión activa se redirige al login.

## Permisos

| Rol     | Consultar | Crear y editar | Eliminar |
| ------- | --------- | -------------- | -------- |
| ADMIN   | Sí        | Sí             | Sí       |
| EDITOR  | Sí        | Sí             | No       |
| LECTURA | Sí        | No             | No       |

La modificación exige un proceso activo de la empresa de la sesión, sin acceso de solo lectura.
El backend sigue validando las operaciones. Eliminar requiere confirmación y desactiva el elemento.

## Formularios

Los eventos admiten INICIO y FIN, nombre de hasta 150 caracteres, pool de origen activo
que no sea caja negra y coordenadas numéricas opcionales.

Las notificaciones requieren un pool de origen interno y uno de destino de caja negra.
Los destinos admitidos son CORREO, SERVICIO_WEB y COLA. Las acciones ante fallos son
CONTINUAR, DERIVAR_ERROR y FINALIZAR. DERIVAR_ERROR exige una actividad activa del proceso.
El momento del proceso admite hasta 250 caracteres. Cada campo de datos requiere nombre
de hasta 100 caracteres y tipo de hasta 50 caracteres. Los textos obligatorios no pueden
contener únicamente espacios.

Al editar se conserva el proceso y el pool de origen. Los errores del backend y sus campos
inválidos aparecen en pantalla. Si faltan pools o actividades, el formulario informa qué
catálogo necesita el proceso; no crea elementos de otros módulos.

## Verificación del 26 de octubre de 2026

Compilación de producción: npm run build.

Suite completa: npm test -- --watch=false. Resultado: 83 pruebas aprobadas en 9 archivos.

Se verificaron las rutas, carga, estado vacío, errores HTTP, validaciones, creación,
actualización, confirmación y eliminación, sesión, permisos y cambios del proceso de la ruta.
También se verificó que el listado y detalle de procesos se actualicen al recibir HTTP,
para permitir el acceso a las secciones sin otra interacción del usuario.

El recorrido de navegador se ejecutó contra el backend Proyecto-Entrega-1, rama developer,
commit c02c9aa, con H2 temporal aislada. Se comprobaron login, selección de proceso,
creación, consulta, edición y eliminación de eventos y notificaciones. Los perfiles
LECTURA y EDITOR se comprobaron en pantalla y mediante respuestas HTTP 403 del backend.
El backend devuelve HTTP 409 si DERIVAR_ERROR no incluye una actividad.

## Dependencia pendiente del backend

POST /api/actividades falla con HTTP 500: ActividadService.crear no asigna el pool heredado
de NodoProceso y la base rechaza pool_id nulo. Esto impide preparar una actividad mediante
esa API para el recorrido real de DERIVAR_ERROR. El selector y la validación condicional
están cubiertos por pruebas de componentes. La corrección de creación de actividades
corresponde al módulo de actividades; no se cambió ese backend en esta entrega.
