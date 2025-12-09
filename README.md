# 🎯 MCN Aprobaciones - Frontend

Panel de administración para gestionar aprobaciones de presupuestos y órdenes de compra.

**🌐 Producción:** https://aprobaciones.lexastech.cl  
**📚 Documentación Completa:** [AGENTS.md](AGENTS.md)  
**🐳 Docker Hub:** https://hub.docker.com/r/mmoyac/mcn_aprobaciones_frontend

---

## 📋 Tabla de Contenidos

- [Pre-requisitos](#-pre-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Desarrollo Local](#-desarrollo-local)
- [Scripts Disponibles](#-scripts-disponibles)
- [Stack Tecnológico](#-stack-tecnológico)
- [Deployment](#-deployment)

---

## 🔧 Pre-requisitos

Antes de comenzar, asegúrate de tener instalado:

### Requerimientos Obligatorios

| Software | Versión Mínima | Verificar Instalación | Descargar |
|----------|----------------|----------------------|-----------|
| **Node.js** | 18.x o superior | `node --version` | https://nodejs.org |
| **npm** | 9.x o superior | `npm --version` | (incluido con Node.js) |
| **Git** | 2.x o superior | `git --version` | https://git-scm.com |

### Verificar Versiones Instaladas

Abre tu terminal (PowerShell en Windows, Terminal en macOS/Linux) y ejecuta:

```bash
# Verificar Node.js
node --version
# Ejemplo de salida correcta: v20.10.0

# Verificar npm
npm --version
# Ejemplo de salida correcta: 10.2.3

# Verificar Git
git --version
# Ejemplo de salida correcta: git version 2.43.0
```

**✅ Si todas las versiones son iguales o superiores a las mínimas, estás listo para continuar.**

**❌ Si alguna está desactualizada o no instalada:**
- **Node.js y npm:** Descarga desde https://nodejs.org (recomendado: versión LTS)
- **Git:** Descarga desde https://git-scm.com/downloads

### Opcional (para desarrollo avanzado)

- **Docker** (si quieres ejecutar en contenedor): https://docker.com
- **VS Code** (editor recomendado): https://code.visualstudio.com

---

## 📥 Instalación

### 1️⃣ Clonar el Repositorio

```bash
# HTTPS
git clone https://github.com/mmoyac/mcn_aprobaciones_frontend.git

# O con SSH (si tienes configurado)
git clone git@github.com:mmoyac/mcn_aprobaciones_frontend.git

# Entrar al directorio
cd mcn_aprobaciones_frontend
```

### 2️⃣ Instalar Dependencias

```bash
npm install
```

**Nota:** Este comando instalará todas las dependencias listadas en `package.json`:
- Next.js 16.0.8
- React 19
- TypeScript 5.x
- Tailwind CSS 3.x
- TanStack React Query 5.x
- Axios 1.7.x
- lucide-react (iconos)
- js-cookie (manejo de cookies)
- date-fns (manejo de fechas)

El proceso puede tardar 1-2 minutos dependiendo de tu conexión.

---

## ⚙️ Configuración

### 1️⃣ Crear Archivo de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Windows PowerShell
New-Item -Path ".env.local" -ItemType File

# macOS/Linux
touch .env.local
```

### 2️⃣ Configurar Variables de Entorno

Abre `.env.local` y agrega:

```env
# URL de la API Backend
NEXT_PUBLIC_API_URL=https://api.lexastech.cl/api/v1

# Para desarrollo local apuntando al backend local:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**⚠️ IMPORTANTE:**
- Las variables que empiezan con `NEXT_PUBLIC_` son accesibles en el navegador
- **NUNCA** pongas secretos sensibles en variables `NEXT_PUBLIC_*`
- El archivo `.env.local` está en `.gitignore` y **NO** se sube al repositorio

---

## 🚀 Desarrollo Local

### Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

**Resultado esperado:**

```
   ▲ Next.js 16.0.8 (Turbopack)
   - Local:         http://localhost:3000
   - Network:       http://192.168.1.x:3000

 ✓ Starting...
 ✓ Ready in 2.3s
```

### Acceder a la Aplicación

1. Abre tu navegador en: **http://localhost:3000**
2. Deberías ver la página de login
3. **Hot Reload:** Los cambios en el código se reflejan automáticamente

### Credenciales de Prueba

Para probar localmente, usa las credenciales de la base de datos de desarrollo:

```
Usuario: ALBERTO
Contraseña: [consultar con el equipo]
```

---

## 📜 Scripts Disponibles

| Comando | Descripción | Uso |
|---------|-------------|-----|
| `npm run dev` | Inicia servidor de desarrollo con Turbopack | Desarrollo diario |
| `npm run build` | Crea build optimizado de producción | Pre-deployment |
| `npm start` | Ejecuta el build de producción | Testing de producción local |
| `npm run lint` | Ejecuta ESLint para verificar código | Control de calidad |
| `npm run type-check` | Verifica tipos de TypeScript sin compilar | Verificación rápida |

### Ejemplos de Uso

```bash
# Desarrollo (con hot reload)
npm run dev

# Verificar que el build de producción funciona
npm run build
npm start

# Verificar linting antes de commit
npm run lint
```

---

## 🛠️ Stack Tecnológico

### Frontend Framework
- **Next.js 16.0.8** - Framework React con App Router
- **React 19** - Librería de UI
- **TypeScript 5.x** - Tipado estático

### Estilos
- **Tailwind CSS 3.x** - Framework CSS utilitario
- **Dark Mode** - Tema oscuro por defecto (slate-900)

### State Management & Data Fetching
- **TanStack React Query 5.x** - Cache y sincronización de datos
- **Axios 1.7.x** - Cliente HTTP con interceptores

### Utilidades
- **js-cookie** - Manejo de cookies (JWT tokens)
- **date-fns** - Manipulación de fechas
- **lucide-react** - Iconos modernos
- **clsx + tailwind-merge** - Merge de clases CSS

### Autenticación
- **JWT Tokens** - Almacenados en cookies
- **Bearer Token** - En header `Authorization`
- **Expiración:** 30 minutos

---

## 🐳 Deployment

### Producción (Automático)

El deployment se realiza automáticamente vía **GitHub Actions** cuando se crea un tag:

```bash
git tag -a v1.0.9 -m "Descripción de cambios"
git push origin v1.0.9
```

**Workflow:**
1. Build de imagen Docker
2. Push a Docker Hub
3. Deploy a VPS vía SSH
4. Configuración de Nginx + SSL
5. Disponible en https://aprobaciones.lexastech.cl

### Docker Local

Para probar el build de Docker localmente:

```bash
# Build de imagen
docker build -t mcn_aprobaciones_frontend .

# Ejecutar contenedor
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.lexastech.cl/api/v1 mcn_aprobaciones_frontend
```

---

## 📂 Estructura del Proyecto

```
mcn_aprobaciones_frontend/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Rutas de autenticación
│   │   └── login/           # Página de login
│   ├── (dashboard)/         # Rutas protegidas
│   │   └── dashboard/       # Dashboard y módulos
│   ├── layout.tsx           # Layout principal
│   └── providers.tsx        # React Query Provider
├── lib/                     # Lógica compartida
│   ├── api/                 # Clientes de API
│   ├── types/               # TypeScript interfaces
│   └── utils/               # Utilidades
├── components/              # Componentes reutilizables
├── public/                  # Assets estáticos
├── .github/workflows/       # CI/CD
├── Dockerfile               # Build de producción
└── docker-compose.prod.yml  # Orquestación
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module"
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3000 already in use"
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Error: "NEXT_PUBLIC_API_URL is not defined"
- Verifica que `.env.local` existe
- Verifica que la variable está correctamente escrita
- Reinicia el servidor de desarrollo (`Ctrl+C` y `npm run dev`)

### Problemas con TypeScript
```bash
# Verificar tipos sin compilar
npm run type-check

# Si hay errores persistentes
rm -rf .next
npm run dev
```

---

## 📚 Documentación Adicional

- **[AGENTS.md](AGENTS.md)** - Guía completa de arquitectura y deployment
- **[Next.js Docs](https://nextjs.org/docs)** - Documentación oficial de Next.js
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Documentación de Tailwind
- **[React Query](https://tanstack.com/query)** - Documentación de TanStack Query

---

## 🤝 Contribuir

### Workflow de Git

1. Crear branch desde `main`:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

2. Hacer commits descriptivos:
   ```bash
   git commit -m "feat: agregar filtro de fechas en presupuestos"
   ```

3. Push y crear Pull Request:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```

### Convenciones de Commits

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan lógica)
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Tareas de mantenimiento

---

## 📄 Licencia

Este proyecto es privado y de uso interno.

---

## 👥 Equipo

**Desarrollado por:** LexasTech  
**Repositorio:** https://github.com/mmoyac/mcn_aprobaciones_frontend  
**Producción:** https://aprobaciones.lexastech.cl

---

**¿Problemas o dudas?** Consulta [AGENTS.md](AGENTS.md) o contacta al equipo de desarrollo.
