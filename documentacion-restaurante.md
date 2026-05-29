# Documentación del Proyecto: Sistema de Gestión de Restaurante

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Backend — API REST](#backend--api-rest)
   - [Configuración e Instalación](#configuración-e-instalación)
   - [Variables de Entorno](#variables-de-entorno)
   - [Base de Datos](#base-de-datos)
   - [Autenticación y Roles](#autenticación-y-roles)
   - [Endpoints de la API](#endpoints-de-la-api)
6. [Frontend — React SPA](#frontend--react-spa)
   - [Enrutamiento por Rol](#enrutamiento-por-rol)
   - [Contextos Globales](#contextos-globales)
   - [Páginas por Rol](#páginas-por-rol)
7. [Flujos Principales](#flujos-principales)
8. [Reglas de Negocio](#reglas-de-negocio)

---


id | Rol            | Nombre              | Correo                              | Contraseña
----|----------------|---------------------|-------------------------------------|--------------------------
  1 | admin_punto    | Carlos Ramírez      | admin.principal@restaurante.com     | AdminPrincipal2026!
  2 | mesero         | Andrea Moreno       | mesero.principal1@restaurante.com   | MeseroPrincipal1_2026!
  3 | mesero         | Julián Castillo     | mesero.principal2@restaurante.com   | MeseroPrincipal2_2026!
  4 | cocinero       | Paula Rojas         | cocinero.principal@restaurante.com  | CocineroPrincipal_2026!
  5 | inversionista  | Fernando Silva      | inversionista1@restaurante.com      | InversionistaPrincipal2026!

 19 | super_admin    | Laura Méndez        | superadmin@restaurante.com          | SuperAdmin2026!
 20 | admin_general  | Santiago Gómez      | admin.general@restaurante.com       | AdminGeneral2026!
 21 | admin_punto    | Valentina Castro    | admin.norte@restaurante.com         | AdminPunto_Norte2026!
 22 | admin_punto    | Ricardo Ospina      | admin.medellin@restaurante.com      | AdminPunto_Med2026!
 23 | mesero         | Felipe Rodríguez    | mesero.norte1@restaurante.com       | Mesero_Norte1_2026!
 24 | mesero         | Juliana Herrera     | mesero.norte2@restaurante.com       | Mesero_Norte2_2026!
 25 | cocinero       | Miguel Vargas       | cocinero.norte@restaurante.com      | Cocinero_Norte_2026!
 26 | mesero         | Daniela Morales     | mesero.medellin@restaurante.com     | Mesero_Med_2026!
 27 | cocinero       | Sebastián Díaz      | cocinero.medellin@restaurante.com   | Cocinero_Med_2026!
 28 | inversionista  | Andrés Silva        | inversionista2@restaurante.com      | Inversionista2026!
 29 | cliente        | María Jose López    | maria1@gmail.com                    | 123456
 30 | cliente        | Camilo Restrepo     | camilo.r@hotmail.com                | Cliente_Camilo2026!
 31 | cliente        | Luisa Fernández     | luisa.f@gmail.com                   | Cliente_Luisa2026!


## Descripción General

Sistema web para la gestión integral de un restaurante con múltiples sedes. Permite administrar mesas, pedidos, menú, inventario, reservas, facturación y usuarios, con acceso diferenciado según el rol de cada persona.

**Roles del sistema:** `super_admin`, `admin_general`, `admin_punto`, `cocinero`, `mesero`, `cliente`, `inversionista`.

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente (Browser)                     │
│              React SPA  –  localhost:3000                │
└───────────────────────────┬─────────────────────────────┘
                            │  HTTP / JSON  (JWT en header)
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Backend  –  Express.js  :5000               │
│   /api/auth  /api/mesas  /api/pedidos  /api/menu         │
│   /api/inventario  /api/facturas  /api/reservas          │
│   /api/usuarios                                          │
└───────────────────────────┬─────────────────────────────┘
                            │  mysql2 (pool de conexiones)
                            ▼
┌─────────────────────────────────────────────────────────┐
│               MySQL  –  localhost:3306                   │
│               Base de datos: restaurante                 │
└─────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

| Capa       | Tecnología                                          |
|------------|-----------------------------------------------------|
| Frontend   | React 18, Context API, CSS-in-JS (estilos inline)   |
| Backend    | Node.js 18+, Express 4, nodemon (dev)               |
| Auth       | JSON Web Tokens (`jsonwebtoken`), bcryptjs           |
| Base de datos | MySQL 8 vía `mysql2/promise` (pool)              |
| CORS       | `cors` con origen fijo a `http://localhost:3000`    |
| Entorno    | `dotenv`                                            |

---

## Estructura de Archivos

```
restaurante/
├── backend/
│   ├── .env                        # Variables de entorno reales (no versionar)
│   ├── .env.example                # Plantilla de variables
│   ├── package.json
│   └── src/
│       ├── app.js                  # Entrada: middlewares + rutas + servidor
│       ├── config/
│       │   └── db.js               # Pool de conexiones MySQL
│       ├── middleware/
│       │   └── auth.js             # verificarToken · soloRoles
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── facturasController.js
│       │   ├── inventarioController.js
│       │   ├── menuController.js
│       │   ├── mesasController.js
│       │   ├── pedidosController.js
│       │   ├── reservasController.js
│       │   └── usuariosController.js
│       └── routes/
│           ├── auth.js
│           ├── facturas.js
│           ├── inventario.js
│           ├── menu.js
│           ├── mesas.js
│           ├── pedidos.js
│           ├── reservas.js
│           └── usuarios.js
└── frontend/
    ├── package.json
    └── src/
        ├── App.js                  # Raíz: AuthProvider + RestauranteProvider + AppRouter
        ├── index.js
        ├── context/
        │   ├── AuthContext.jsx     # Sesión JWT, login/logout, permisos (PERMISOS, usePuede)
        │   └── RestauranteContext.jsx  # Estado local de mesas y pedidos (demo)
        ├── routes/
        │   └── AppRouter.jsx       # Despacha al dashboard según user.rol
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── MeseroDashboard.jsx
        │   ├── CocineroPage.jsx
        │   ├── AdminPage.jsx
        │   ├── AdminGeneralPage.jsx
        │   ├── InversionistaPage.jsx
        │   ├── ClientePage.jsx
        │   └── SuperAdminPage.jsx
        ├── components/
        │   ├── admin/
        │   ├── cliente/
        │   ├── cocinero/
        │   ├── mesero/
        │   └── shared/
        │       ├── Badge.jsx · CartSummary.jsx · Navbar.jsx
        │       ├── Sidebar.jsx · Table.jsx · Toast.jsx
        ├── hooks/
        │   └── useAuth.js
        └── services/
            └── api.js              # Cliente HTTP que añade el JWT a cada petición
```

---

## Backend — API REST

### Configuración e Instalación

```bash
# 1. Entrar a la carpeta
cd restaurante/backend

# 2. Copiar y editar variables de entorno
cp .env.example .env

# 3. Instalar dependencias
npm install

# 4. Iniciar
npm run dev    # desarrollo — nodemon (reinicio automático)
npm start      # producción
```

El servidor queda disponible en `http://localhost:5000`.

### Variables de Entorno

| Variable        | Descripción                              | Valor por defecto |
|-----------------|------------------------------------------|-------------------|
| `DB_HOST`       | Host de MySQL                            | `localhost`       |
| `DB_PORT`       | Puerto de MySQL                          | `3306`            |
| `DB_USER`       | Usuario de MySQL                         | `root`            |
| `DB_PASSWORD`   | Contraseña de MySQL                      | *(vacío)*         |
| `DB_NAME`       | Nombre de la base de datos               | `restaurante`     |
| `JWT_SECRET`    | Clave secreta para firmar tokens         | *(obligatorio)*   |
| `JWT_EXPIRES_IN`| Duración del token                       | `8h`              |
| `PORT`          | Puerto del servidor Express              | `5000`            |

### Base de Datos

El pool de conexiones (`src/config/db.js`) se configura con:
- `connectionLimit: 10`
- `timezone: "local"`
- Verifica la conexión al arrancar; termina el proceso si falla.

**Tablas principales inferidas del código:**

| Tabla                  | Descripción                                     |
|------------------------|-------------------------------------------------|
| `usuarios`             | Cuentas de acceso con rol y sede                |
| `roles`                | Catálogo de roles                               |
| `sedes`                | Sucursales del restaurante                      |
| `empleados`            | Datos laborales; vincula usuario ↔ id_empleado  |
| `mesas`                | Mesas por sede con flag `disponible`            |
| `menus`                | Menús activos por sede                          |
| `platos`               | Platos del menú con precio y disponibilidad     |
| `recetas`              | Receta y tiempo de preparación por plato        |
| `receta_ingredientes`  | Ingredientes y cantidades por receta            |
| `productos_inventario` | Stock, cantidad mínima y fecha de vencimiento   |
| `categorias_producto`  | Categorías de inventario                        |
| `proveedores`          | Proveedores de inventario                       |
| `pedidos`              | Cabecera del pedido (mesa, mesero, estado)      |
| `pedido_detalle`       | Ítems del pedido (plato, cantidad, alergias)    |
| `facturas`             | Factura generada desde un pedido listo          |
| `metodos_pago`         | Catálogo de métodos de pago                     |
| `clientes`             | Datos del cliente para reservas y facturas      |
| `reservas`             | Reservas de mesa con estado `activa/cancelada`  |

**Crear primer usuario administrador (MySQL):**

```sql
INSERT INTO sedes (nombre, ciudad, pais)
  VALUES ('Sede Principal', 'Bogotá', 'Colombia');

INSERT INTO usuarios (id_rol, id_sede, nombres, apellidos, correo, contrasena)
  VALUES (
    3,   -- admin_punto
    1,   -- id_sede recién creada
    'Admin', 'Principal',
    'admin@restaurante.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewVyWkey0YHSfp2e'
    -- contraseña en texto: admin123
  );
```

### Autenticación y Roles

Todos los endpoints (excepto `/api/auth/login`) requieren el header:

```
Authorization: Bearer <token_jwt>
```

El token lleva el payload `{ id_usuario, id_rol, rol, id_sede, nombres }`. El middleware `soloRoles(...roles)` rechaza con `403` si el rol del usuario no está en la lista.

**Jerarquía de acceso (de mayor a menor):**

```
super_admin > admin_general > admin_punto > cocinero / mesero > cliente / inversionista
```

### Endpoints de la API

#### Autenticación — `/api/auth`

| Método | Ruta   | Descripción                    | Auth requerida |
|--------|--------|--------------------------------|----------------|
| POST   | `/login` | Login; devuelve `{ token, usuario }` | No       |
| GET    | `/me`    | Perfil del usuario autenticado | Sí             |

**Body de login:**
```json
{ "correo": "admin@restaurante.com", "contrasena": "admin123" }
```

---

#### Mesas — `/api/mesas`

| Método | Ruta     | Descripción                        | Roles permitidos                            |
|--------|----------|------------------------------------|---------------------------------------------|
| GET    | `/`      | Lista mesas de la sede del usuario | Todos (autenticados)                        |
| PUT    | `/:id`   | Actualiza flag `disponible`        | `mesero`, `admin_punto`, `admin_general`, `super_admin` |

---

#### Pedidos — `/api/pedidos`

| Método | Ruta            | Descripción                           | Roles permitidos                                     |
|--------|-----------------|---------------------------------------|------------------------------------------------------|
| GET    | `/`             | Pedidos activos de la sede (excluye entregados/cancelados) | Todos (autenticados)          |
| POST   | `/`             | Crear pedido con ítems                | `mesero`, `admin_punto`, `super_admin`               |
| PUT    | `/:id/estado`   | Avanzar estado del pedido             | `cocinero`, `mesero`, `admin_punto`, `super_admin`   |

**Body de creación de pedido:**
```json
{
  "id_mesa": 3,
  "observacion": "Mesa cerca de la ventana",
  "items": [
    { "id_plato": 5, "cantidad": 2, "observacion": "sin sal", "alergias_texto": "gluten" }
  ]
}
```

**Estados válidos y transiciones permitidas:**

```
pendiente → en_preparacion → listo → entregado
    ↘           ↘            ↘
   cancelado  cancelado   cancelado
```

---

#### Menú — `/api/menu`

| Método | Ruta             | Descripción                              | Roles permitidos                                 |
|--------|------------------|------------------------------------------|--------------------------------------------------|
| GET    | `/`              | Platos activos del menú activo de la sede | Todos (autenticados)                            |
| GET    | `/:id/receta`    | Receta e ingredientes de un plato        | `cocinero`, `admin_punto`, `admin_general`, `super_admin` |

---

#### Inventario — `/api/inventario`

| Método | Ruta   | Descripción                                              | Roles permitidos                                      |
|--------|--------|----------------------------------------------------------|-------------------------------------------------------|
| GET    | `/`    | Inventario con alertas (`bajo`, `por_vencer`, `ok`)      | `cocinero`, `admin_punto`, `admin_general`, `super_admin` |
| PUT    | `/:id` | Actualizar `cantidad_actual` de un producto              | `admin_punto`, `admin_general`, `super_admin`         |

**Alertas automáticas devueltas:**
- `bajo` → `cantidad_actual ≤ cantidad_minima`
- `por_vencer` → `fecha_vencimiento` a ≤ 5 días
- `ok` → sin alerta

---

#### Facturas — `/api/facturas`

| Método | Ruta             | Descripción                                | Roles permitidos                                    |
|--------|------------------|--------------------------------------------|-----------------------------------------------------|
| GET    | `/`              | Todas las facturas de la sede              | `admin_punto`, `admin_general`, `super_admin`       |
| GET    | `/mis-facturas`  | Facturas de pedidos del mesero autenticado | `mesero`                                            |
| POST   | `/`              | Generar factura para un pedido             | `admin_punto`, `admin_general`, `super_admin`       |

**Body para crear factura:**
```json
{
  "id_pedido": 15,
  "id_cliente": 3,        // opcional
  "id_metodo_pago": 1,
  "propina": 5000,        // opcional, ≥ 0
  "iva_porcentaje": 19    // opcional, default 19.0
}
```

**Lógica de facturación:**
- El pedido debe estar en estado `listo`.
- No puede haberse facturado antes.
- Calcula `subtotal`, `iva_valor`, `total` automáticamente.
- Al facturar: pedido pasa a `entregado` y la mesa queda `disponible = 1`.

---

#### Reservas — `/api/reservas`

| Método | Ruta              | Descripción                    | Roles permitidos      |
|--------|-------------------|--------------------------------|-----------------------|
| GET    | `/`               | Reservas activas de la sede    | Todos (autenticados)  |
| POST   | `/`               | Crear reserva                  | Todos (autenticados)  |
| PUT    | `/:id/cancelar`   | Cancelar reserva               | Todos (autenticados)  |

**Reglas de negocio:**
- La reserva debe hacerse con **mínimo 1 hora** de anticipación.
- No puede haber otra reserva en la misma mesa en un margen de **2 horas**.
- Solo se puede cancelar con **más de 2 horas** de anticipación.

---

#### Usuarios — `/api/usuarios`

Requiere rol `admin_punto`, `admin_general` o `super_admin`.

| Método | Ruta            | Descripción                     |
|--------|-----------------|---------------------------------|
| GET    | `/`             | Lista usuarios (filtra por sede o todos si es `super_admin`) |
| POST   | `/`             | Crear usuario (contraseña con bcrypt, factor 12) |
| PUT    | `/:id/activo`   | Activar / desactivar usuario    |

---

## Frontend — React SPA

### Configuración e Instalación

```bash
cd restaurante/frontend
npm install
npm start     # http://localhost:3000
```

### Enrutamiento por Rol

`AppRouter.jsx` no usa React Router. El despacho es por valor de `user.rol` devuelto por el backend:

| Rol            | Componente renderizado  |
|----------------|-------------------------|
| `mesero`       | `MeseroDashboard`       |
| `cocinero`     | `CocineroPage`          |
| `admin_punto`  | `AdminPage`             |
| `admin_general`| `AdminGeneralPage`      |
| `inversionista`| `InversionistaPage`     |
| `cliente`      | `ClientePage`           |
| `super_admin`  | `SuperAdminPage`        |

Si no hay sesión activa, se muestra `LoginPage`.

### Contextos Globales

#### `AuthContext` (`src/context/AuthContext.jsx`)

Provee a toda la app:

| Valor/Función  | Tipo       | Descripción                                             |
|----------------|------------|---------------------------------------------------------|
| `user`         | objeto     | Datos del usuario autenticado (`rol`, `id_sede`, etc.)  |
| `login(correo, contrasena)` | async fn | Llama a `api.login`, guarda el token en `localStorage` |
| `logout()`     | fn         | Elimina token y limpia el estado                        |

**Hook de permisos:**
```jsx
const puede = usePuede();
if (puede("generarFactura")) { ... }
```

**Tabla de permisos (objeto `PERMISOS`):**

| Permiso              | Roles autorizados                                          |
|----------------------|------------------------------------------------------------|
| `verProveedores`     | `admin_general`, `super_admin`                             |
| `verSalarios`        | `admin_general`, `super_admin`                             |
| `verMemorandos`      | `admin_general`, `super_admin`, `admin_punto`              |
| `verFinanzasGlobales`| `super_admin`                                              |
| `verFinanzasSede`    | `admin_general`, `super_admin`, `inversionista`            |
| `verIVA`             | `admin_general`, `super_admin`                             |
| `verPropinas`        | `admin_general`, `super_admin`                             |
| `verTotalIngresos`   | `admin_general`, `super_admin`, `inversionista`            |
| `verEgresos`         | `admin_general`, `super_admin`, `inversionista`            |
| `verLicencias`       | `admin_general`, `super_admin`, `admin_punto`              |
| `verEmpleados`       | `admin_general`, `super_admin`                             |
| `generarFactura`     | `admin_punto`, `super_admin`, `admin_general`              |
| `verResumenPagos`    | `admin_punto`, `admin_general`, `super_admin`              |
| `crearMenu`          | `admin_punto`, `admin_general`, `super_admin`              |
| `verRecetas`         | `cocinero`, `super_admin`                                  |
| `verColaPedidos`     | `cocinero`, `super_admin`                                  |
| `hacerPedido`        | `mesero`, `super_admin`                                    |
| `verMisPedidos`      | `mesero`, `super_admin`                                    |
| `verReservas`        | `cliente`, `admin_punto`, `admin_general`, `super_admin`   |
| `responderEncuesta`  | `cliente`                                                  |
| `verEncuestas`       | `admin_punto`, `admin_general`, `super_admin`              |

> **Nota:** `super_admin` siempre tiene todos los permisos (bypassa la tabla).

#### `RestauranteContext` (`src/context/RestauranteContext.jsx`)

Maneja estado local de mesas y pedidos con datos de demostración (no conecta al backend). Provee:

| Función               | Descripción                                        |
|-----------------------|----------------------------------------------------|
| `agregarPedido(p)`    | Añade pedido y marca mesa como ocupada             |
| `avanzarEstadoPedido(id)` | `pendiente → en_preparacion → listo`           |
| `entregarPedido(id)`  | Marca pedido como `entregado`                      |

### Páginas por Rol

| Página               | Funcionalidades principales                                             |
|----------------------|-------------------------------------------------------------------------|
| `LoginPage`          | Formulario de login + accesos rápidos de demo; llama a `AuthContext.login` |
| `MeseroDashboard`    | Ver mesas, crear pedidos, gestionar estado, ver facturas propias        |
| `CocineroPage`       | Cola de pedidos activos, avanzar estado, ver recetas e inventario       |
| `AdminPage`          | Panel completo: mesas, pedidos, facturación, inventario, reservas, usuarios |
| `AdminGeneralPage`   | Vista gerencial de múltiples sedes                                      |
| `InversionistaPage`  | Reportes financieros y métricas de rendimiento                          |
| `ClientePage`        | Reservas, carta y encuestas de satisfacción                             |
| `SuperAdminPage`     | Acceso total: todas las funciones + configuración global                |

---

## Flujos Principales

### Flujo de un Pedido

```
Mesero crea pedido (POST /api/pedidos)
  │  → Verifica: mesa disponible, sin pedido activo, platos válidos
  │  → Inserta pedido + detalle en transacción
  │  → Mesa pasa a disponible = 0
  ▼
Cocinero cambia a "en_preparacion" (PUT /api/pedidos/:id/estado)
  ▼
Cocinero cambia a "listo"
  ▼
Admin genera factura (POST /api/facturas)
  │  → Calcula subtotal, IVA, propina, total
  │  → Pedido pasa a "entregado"
  │  → Mesa pasa a disponible = 1
  ▼
Flujo completado
```

### Flujo de Autenticación

```
Usuario envía correo + contraseña
  │
  ▼
Backend verifica en BD (bcrypt.compare)
  │  → Comprueba usuario activo
  │  → Firma JWT con { id_usuario, id_rol, rol, id_sede, nombres }
  ▼
Frontend guarda token en localStorage
  │
  ▼
AppRouter lee user.rol → renderiza dashboard correspondiente
  │
  ▼
Cada petición incluye "Authorization: Bearer <token>"
  │
  ▼
middleware verificarToken decodifica y adjunta req.usuario
```

---

## Reglas de Negocio

| Módulo      | Regla                                                                        |
|-------------|------------------------------------------------------------------------------|
| Pedidos     | Una mesa solo puede tener un pedido activo a la vez                          |
| Pedidos     | Las transiciones de estado son unidireccionales y validadas                  |
| Pedidos     | Al entregar o cancelar, la mesa se libera automáticamente                    |
| Facturas    | Solo se puede facturar si el pedido está en estado `listo`                   |
| Facturas    | Un pedido no puede facturarse más de una vez                                 |
| Facturas    | IVA por defecto: 19%. Propina: opcional, no puede ser negativa               |
| Inventario  | Alerta `bajo` si `cantidad_actual ≤ cantidad_minima`                        |
| Inventario  | Alerta `por_vencer` si vence en ≤ 5 días                                    |
| Reservas    | Mínimo 1 hora de anticipación para crear                                     |
| Reservas    | Margen de conflicto: 2 horas entre reservas de la misma mesa                 |
| Reservas    | Solo cancelable con más de 2 horas antes de la reserva                       |
| Usuarios    | Contraseñas hasheadas con bcrypt (factor 12)                                 |
| Usuarios    | Correo único; duplicado retorna `409 Conflict`                               |
| Multi-sede  | Cada usuario opera exclusivamente sobre los datos de su `id_sede`            |
| Multi-sede  | `super_admin` no tiene restricción de sede y ve todo                         |
