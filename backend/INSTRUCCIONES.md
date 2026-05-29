# Restaurante Backend — Instrucciones de instalación

## 1. Requisitos
- Node.js 18+
- MySQL corriendo en Workbench (puerto 3306)

## 2. Configurar variables de entorno
Copia `.env.example` como `.env` y edítalo:
```
cp .env.example .env
```
Cambia estos valores:
- `pasword` → tu contraseña de MySQL
- `restaurante`     → nombre de tu base de datos 
- `JWT_SECRET`  → cualquier texto largo y secreto

## 3. Instalar dependencias
```bash
npm install
```

## 4. Iniciar el servidor
```bash
npm run dev      # desarrollo (nodemon, se reinicia automático)
npm start        # producción
```
El servidor corre en → http://localhost:3000


## 5. Endpoints disponibles
| Método | Ruta                        | Descripción                    | Roles            |
|--------|-----------------------------|--------------------------------|------------------|
| POST   | /api/auth/login             | Login, retorna JWT             | Todos            |
| GET    | /api/auth/me                | Perfil del usuario actual      | Todos            |
| GET    | /api/mesas                  | Mesas de la sede               | Todos            |
| PUT    | /api/mesas/:id              | Actualizar disponibilidad      | Mesero+          |
| GET    | /api/pedidos                | Pedidos activos de la sede     | Todos            |
| POST   | /api/pedidos                | Crear pedido                   | Mesero+          |
| PUT    | /api/pedidos/:id/estado     | Avanzar estado del pedido      | Cocinero/Mesero+ |
| GET    | /api/menu                   | Platos activos del menú        | Todos            |
| GET    | /api/menu/:id/receta        | Receta de un plato             | Cocinero+        |
| GET    | /api/inventario             | Inventario con alertas         | Cocinero+        |
| PUT    | /api/inventario/:id         | Actualizar cantidad            | Admin+           |
| GET    | /api/facturas               | Facturas de la sede            | Admin+           |
| POST   | /api/facturas               | Generar factura                | Admin+           |
| GET    | /api/reservas               | Reservas activas               | Todos            |
| POST   | /api/reservas               | Crear reserva                  | Todos            |
| PUT    | /api/reservas/:id/cancelar  | Cancelar reserva (regla 1h)    | Todos            |
| GET    | /api/usuarios               | Lista de usuarios de la sede   | Admin+           |
| POST   | /api/usuarios               | Crear usuario                  | Admin+           |
| PUT    | /api/usuarios/:id/activo    | Activar/desactivar usuario     | Admin+           |

## 6. Crear primer usuario administrador
Ejecuta esto en MySQL Workbench para crear un admin con contraseña `admin123`:
```sql
INSERT INTO sedes (nombre, ciudad, pais) VALUES ('Sede Principal', 'Bogotá', 'Colombia');

INSERT INTO usuarios (id_rol, id_sede, nombres, apellidos, correo, contrasena)
VALUES (
  3,  -- admin_punto (ver tabla roles)
  1,  -- id de la sede recién creada
  'Admin',
  'Principal',
  'admin@restaurante.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewVyWkey0YHSfp2e'
  -- contraseña: admin123
);
```
