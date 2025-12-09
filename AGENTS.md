# 🔧 AGENTS.MD: Backoffice Admin Panel - Guía Operacional (Next.js & Docker)

Este documento es el manual de operaciones y contexto esencial para el **Backoffice Admin Panel**. La aplicación es un **Next.js** que consume la API REST de FastAPI (`mcn_aprobaciones_backend`) y **se despliega usando Docker**.

---

## 1. ⚙️ Arquitectura y Stack Tecnológico

El Backoffice está diseñado para ser de momento una aplicación para la gerencia, con autenticación y permisos para gestionar las aprobraciones de presupuestos y ordenes de compra

| Componente | Tecnología | Rol |
| :--- | :--- | :--- |
| **Framework** | **Next.js (React)** | Construcción de la interfaz administrativa con App Router. |
| **Estilos** | **Tailwind CSS** | Framework CSS utilitario para diseño rápido y responsivo. |
| **Consumo de API** | **Fetch API / Axios** | Conexión a los endpoints de FastAPI. |
| **Autenticación** | **JWT / Next-Auth** | Sistema de login para proteger rutas administrativas. |
| **Orquestación** | **Docker / Docker Compose** | Despliegue y ejecución en producción/staging. |

---

## 2. 🔌 Integración con la API (Backend FastAPI)

### 2.1. URL Base de la API

Se deben usar las api que ya se encuentran en produccion en la ruta api.lexastech.cl. Debes utilizar el openapi que esta en el siguientye enlace: https://api.lexastech.cl/openapi.json

### 2.3. Directrices de Implementación

* **Autenticación:** Todas las rutas del backoffice deben estar protegidas con middleware de autenticación.
* **Validación:** Validar formularios en frontend antes de enviar a la API.
* **Feedback:** Mostrar notificaciones de éxito/error en todas las operaciones.
* **Tipado:** Los *schemas* de datos del frontend deben coincidir con los *schemas* Pydantic del backend.

---

## 3. 📄 Estructura y Funcionalidades

### 3.1. Estructura del Backoffice

El backoffice debe tener una estructura modular con navegación lateral o superior para acceder a las diferentes secciones administrativas.

**Secciones principales:**
- **Dashboard:** Vista general con estadísticas 
- **Prepupuestos:** Sección específica para los Presupuestos
- **Ordenes de Comra:** Sección específica para las Ordenes de Compra

### 3.2. Reglas de Negocio en Backoffice

* **Permisos:** Solo usuarios autenticados pueden acceder al backoffice.
* **Validaciones:** 

## 4. 🐳 Despliegue y Comandos de Docker

El despliegue del Backoffice se realiza creando una imagen optimizada de Next.js mediante un *build* multi-etapa, definida en su propio **`Dockerfile.prod`**.

Se debe usar PR usando github action, igual como esta funcionando hoy el backend, favor saca todas las ideas que estan hoy

El repositorio para este proyecto esta en:https://github.com/mmoyac/mcn_aprobaciones_frontend

### 4.1. Configuración del Servicio en `docker-compose.prod.yml`

El servicio `backoffice` debe ser configurado en el `docker-compose.yml` principal para su orquestación.

### 4.2. Variables de Entorno Requeridas


### 4.3. Comandos Docker


### 4.4. Configuración de Producción

**Docker Hub:**
- Imagen: `mmoyac/mcn-aprobaciones-frontend:latest`

**VPS:**
- URL: http://168.231.96.205
- Estado: ✅ Operativo


## 5. 🔐 Autenticación y Seguridad

### 5.1. Sistema de Autenticación


### 5.2. Protección de Rutas

## 6. 📊 Convenciones de Código

### 6.1. Estructura de Directorios

### 6.2. Nomenclatura

## 7. 🎨 Diseño y UX

### 7.1. Paleta de Colores

- **Modo:** Dark mode por defecto (consistente con landing)
- **Primario:** Turquesa `rgb(94, 200, 242)`
- **Secundario:** Teal `rgb(69, 162, 154)`
- **Fondo:** `slate-900`
- **Acentos:** `slate-800`, `slate-700`

### 7.2. Componentes UI

Utilizar componentes de **shadcn/ui** o **Headless UI** para:
- Tablas con paginación
- Formularios con validación
- Modales de confirmación
- Notificaciones (toast)
- Upload de archivos

---

## 8. 🧪 Tests (Pendiente)

## 9. 🚀 Roadmap de Desarrollo

### Fase 1: MVP (Completado ✅)
- Se debe comenzar realizando la creacion de directorio, todo bajo la carpeta mcn_aprobaciones_frontend
- Si tienes dudas de que endpoint usar favor preguntar
      
### Fase 2: Testing y Calidad (Pendiente)
- ⏳ Tests de componentes React
- ⏳ Tests E2E con Playwright
- ⏳ Sistema de login con autenticación JWT
- ⏳ Gestión de usuarios admin con roles

### Fase 3: Mejoras y Avanzado
- Auditoría de cambios (log de modificaciones)
- Reportes y exportación (Excel, PDF)
- Notificaciones en tiempo real (WebSockets)

**Docker Hub:** `mmoyac/mcn_aprobaciones_frontend`  