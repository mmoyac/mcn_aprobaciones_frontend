# 🔧 AGENTS.MD: Backoffice Admin Panel - Guía Operacional (Next.js & Docker)

Este documento es el manual de operaciones y contexto esencial para el **Backoffice Admin Panel**. La aplicación es un **Next.js 16** que consume la API REST de FastAPI (`mcn_aprobaciones_backend`) y **se despliega usando Docker con GitHub Actions CI/CD**.

---

## 1. ⚙️ Arquitectura y Stack Tecnológico

| Componente | Tecnología | Versión | Rol |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (React) | 16.0.8 | App Router, SSR, API Routes |
| **Lenguaje** | TypeScript | 5.x | Tipado estático y type safety |
| **Estilos** | Tailwind CSS | 3.x | Framework CSS utilitario |
| **State Management** | TanStack React Query | 5.x | Cache, fetch, mutations |
| **HTTP Client** | Axios | 1.7.x | Cliente HTTP con interceptores |
| **Autenticación** | JWT + js-cookie | - | Tokens en cookies (30 min) |
| **Iconos** | lucide-react | - | Iconografía moderna |
| **Build** | Docker Multi-stage | - | Optimización de imagen |
| **Deployment** | GitHub Actions | - | CI/CD automatizado |
| **Hosting** | VPS + Docker | - | Nginx reverse proxy + SSL |

---

## 2. 🔌 Integración con la API (Backend FastAPI)

### 2.1. URL Base de la API

**Producción:** `https://api.lexastech.cl/api/v1`  
**OpenAPI Docs:** https://api.lexastech.cl/openapi.json  
**Swagger UI:** https://api.lexastech.cl/docs

### 2.2. Configuración de Variables de Entorno

**Archivo `.env.production`:**
```bash
NEXT_PUBLIC_API_URL=https://api.lexastech.cl/api/v1
```

**IMPORTANTE:** Las variables `NEXT_PUBLIC_*` deben estar definidas:
1. En archivo `.env.production`
2. Como `ARG` y `ENV` en Dockerfile durante el stage de **build**
3. Nunca en runtime, Next.js las compila en tiempo de build

### 2.3. Directrices de Implementación

* **Autenticación:** JWT Bearer token en header `Authorization: Bearer <token>`
* **Cookies:** Token almacenado en `js-cookie` con expiración de 30 minutos
* **Interceptores:** Axios intercepta requests (añade token) y responses (maneja 401)
* **Validación:** Validar formularios en frontend antes de enviar a la API
* **Feedback:** Usar notificaciones para éxito/error en todas las operaciones
* **Tipado:** TypeScript interfaces deben coincidir con schemas Pydantic del backend

---

## 3. 📁 Estructura del Proyecto

### 3.1. Árbol de Directorios

```
mcn_aprobaciones_frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo de rutas de autenticación
│   │   └── login/                # Página de login
│   ├── (dashboard)/              # Grupo de rutas protegidas
│   │   └── dashboard/            # Layout con auth guard
│   │       ├── page.tsx          # Dashboard home
│   │       └── presupuestos/     # Módulo de presupuestos
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage (redirige)
│   └── providers.tsx             # React Query Provider
├── lib/                          # Lógica compartida
│   ├── api/                      # Clientes de API
│   │   ├── client.ts             # Axios con interceptores
│   │   ├── auth.ts               # Login, logout, getUser
│   │   └── presupuestos.ts       # CRUD presupuestos
│   ├── types/                    # TypeScript types
│   │   ├── auth.ts               # User, LoginRequest
│   │   └── presupuesto.ts        # Presupuesto, Indicadores
│   └── utils/                    # Utilidades
│       └── cn.ts                 # className merger
├── components/                   # Componentes reutilizables
├── public/                       # Assets estáticos
├── .github/workflows/            # GitHub Actions
│   └── docker-publish.yml        # CI/CD pipeline
├── nginx/conf.d/                 # Configuración Nginx
│   └── aprobaciones.lexastech.cl.conf
├── Dockerfile                    # Multi-stage build
├── docker-compose.prod.yml       # Orquestación producción
├── .dockerignore                 # Exclusiones Docker
├── .env.production               # Variables de entorno
├── next.config.ts                # Configuración Next.js
├── tailwind.config.ts            # Configuración Tailwind
├── tsconfig.json                 # Configuración TypeScript
└── package.json                  # Dependencias NPM
```

### 3.2. Convenciones de Código

**TypeScript:**
- Interfaces para tipos de datos: `User`, `Presupuesto`, `LoginRequest`
- Tipos para respuestas API: `ApiResponse<T>`, `PaginatedResponse<T>`
- Enums para estados: `enum EstadoPresupuesto { Pendiente, Aprobado }`

**React:**
- Componentes funcionales con hooks
- Custom hooks para lógica compartida: `useAuth`, `usePresupuestos`
- Nomenclatura: `PascalCase` para componentes, `camelCase` para funciones

**Estilos:**
- Tailwind utility-first
- Tema dark por defecto (slate-800/900)
- Función `cn()` para merge condicional de clases

---

## 4. 🐳 Docker: Build y Deployment

### 4.1. Dockerfile Multi-stage

**Stages:**
1. **deps:** Instala todas las dependencias (`npm ci` sin `--only=production`)
2. **builder:** Ejecuta `npm run build` con variables de entorno
3. **runner:** Imagen de producción con standalone output

**Configuración de Variables de Entorno en Build:**

```dockerfile
# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# ⚠️ CRÍTICO: Definir variables NEXT_PUBLIC_* en tiempo de build
ARG NEXT_PUBLIC_API_URL=https://api.lexastech.cl/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ⚠️ Redefinir variables para runtime
ARG NEXT_PUBLIC_API_URL=https://api.lexastech.cl/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# ... resto del stage
```

**⚠️ IMPORTANTE:** Next.js requiere variables `NEXT_PUBLIC_*` disponibles durante `npm run build`, no solo en runtime.

### 4.2. docker-compose.prod.yml

```yaml
version: '3.8'

services:
  frontend:
    image: mmoyac/mcn_aprobaciones_frontend:latest
    container_name: mcn_frontend
    restart: unless-stopped
    networks:
      - general-net
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.lexastech.cl/api/v1
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  general-net:
    external: true
```

### 4.3. Nginx Reverse Proxy (nginx-proxy)

**Arquitectura:**
- Proxy centralizado en `/root/docker/nginx-proxy`
- Maneja TODOS los dominios del VPS (puertos 80/443)
- Let's Encrypt automático con certbot
- Network compartida: `general-net`

**Configuración del dominio (`nginx/conf.d/aprobaciones.lexastech.cl.conf`):**

```nginx
server {
    listen 80;
    server_name aprobaciones.lexastech.cl;
    
    # Redirigir HTTP → HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}

server {
    listen 443 ssl http2;
    server_name aprobaciones.lexastech.cl;
    
    ssl_certificate /etc/letsencrypt/live/aprobaciones.lexastech.cl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aprobaciones.lexastech.cl/privkey.pem;
    
    # Proxy a Next.js
    location / {
        proxy_pass http://mcn_frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 5. 🚀 GitHub Actions CI/CD

---

## 5. 🚀 GitHub Actions CI/CD

### 5.1. Workflow Completo (`.github/workflows/docker-publish.yml`)

**Trigger:** Tags con patrón `v*` (ej: `v1.0.8`) o workflow_dispatch manual

**Jobs:**

#### Job 1: build-and-push
1. Checkout del código
2. Setup Docker Buildx
3. Login a Docker Hub
4. Build multi-platform (linux/amd64)
5. Push a Docker Hub con tags:
   - `latest`
   - `v1.0.8` (versión específica)

#### Job 2: deploy-to-vps (depende de build-and-push)
1. **Crear directorios** en VPS:
   ```bash
   mkdir -p /root/docker/mcn-frontend
   mkdir -p /root/docker/mcn-frontend/nginx/conf.d
   mkdir -p /root/docker/nginx-proxy/conf.d
   ```

2. **Copiar archivos** vía SCP:
   - `docker-compose.prod.yml` → `/root/docker/mcn-frontend/docker-compose.yml`
   - `nginx/conf.d/aprobaciones.lexastech.cl.conf` → `/root/docker/mcn-frontend/nginx/conf.d/`

3. **Deploy via SSH:**
   ```bash
   cd /root/docker/mcn-frontend
   
   # Pull última imagen
   docker compose pull
   
   # Detener contenedor anterior
   docker compose down
   
   # Iniciar con force-recreate
   docker compose up -d --force-recreate
   
   # Copiar config nginx al proxy centralizado
   cp nginx/conf.d/aprobaciones.lexastech.cl.conf /root/docker/nginx-proxy/conf.d/
   
   # Recargar nginx
   docker exec nginx_proxy nginx -t && docker exec nginx_proxy nginx -s reload
   ```

4. **Obtener certificado SSL** (si no existe):
   ```bash
   docker exec nginx_certbot certbot certonly \
     --webroot -w /var/www/certbot \
     -d aprobaciones.lexastech.cl \
     --email contacto@lexastech.cl \
     --agree-tos --non-interactive \
     --account 5239744ebdc2bba3102715566dfb64aa
   ```

### 5.2. GitHub Secrets Requeridos

| Secret | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `DOCKER_USERNAME` | Usuario Docker Hub | `mmoyac` |
| `DOCKER_PASSWORD` | Access Token Docker Hub | `dckr_pat_xxx` |
| `VPS_HOST` | IP del VPS | `168.231.96.205` |
| `VPS_USERNAME` | Usuario SSH | `root` |
| `VPS_SSH_KEY` | Clave privada SSH completa | `-----BEGIN OPENSSH...` |
| `VPS_PORT` | Puerto SSH | `22` |

**⚠️ Configurar en:** https://github.com/mmoyac/mcn_aprobaciones_frontend/settings/secrets/actions

### 5.3. Crear y Deployar Nueva Versión

```bash
# Hacer cambios en el código
git add .
git commit -m "feat: nueva funcionalidad"
git push

# Crear tag de versión
git tag -a v1.0.9 -m "Descripción de cambios"
git push origin v1.0.9

# El workflow se ejecuta automáticamente
# Monitorear en: https://github.com/mmoyac/mcn_aprobaciones_frontend/actions
```

### 5.4. Troubleshooting Deployment

**Problema: SSH authentication failed**
- Verificar que `VPS_SSH_KEY` contiene la clave privada completa (con BEGIN/END)
- Verificar que la clave pública está en `/root/.ssh/authorized_keys` del VPS
- Generar nueva clave si es necesario:
  ```bash
  ssh-keygen -t ed25519 -C "github-actions-deploy" -f github-actions-deploy -N ''
  # Copiar privada a GitHub Secret
  # Copiar pública al VPS: echo "ssh-ed25519 AAA..." >> ~/.ssh/authorized_keys
  ```

**Problema: `docker-compose: command not found`**
- El VPS usa Docker Compose v2 (plugin), no v1 (standalone)
- Usar: `docker compose` (espacio) en lugar de `docker-compose` (guión)

**Problema: Variables de entorno no funcionan**
- Next.js requiere `NEXT_PUBLIC_*` en tiempo de **build**, no runtime
- Definir como `ARG` y `ENV` en Dockerfile stage builder
- Nunca usar solo archivo `.env.production` en contenedor

**Problema: Certificado SSL no existe**
- Primero desplegar con config nginx solo HTTP (puerto 80)
- Ejecutar certbot manualmente para obtener certificado
- Luego actualizar config nginx con SSL (puerto 443)
- Recargar nginx: `docker exec nginx_proxy nginx -s reload`

---

## 6. 🔐 Autenticación y Seguridad

### 6.1. Sistema de Autenticación JWT

**Flujo:**
1. Usuario envía credenciales a `POST /api/v1/auth/login`
2. Backend valida y retorna `access_token` (JWT)
3. Frontend guarda token en cookie con `js-cookie`
4. Axios interceptor añade `Authorization: Bearer <token>` en cada request
5. Token expira en 30 minutos
6. 401 response → redirect automático a `/login`

**Implementación:**

```typescript
// lib/api/auth.ts
export const authApi = {
  async login(usuario: string, password: string) {
    const response = await apiClient.post('/auth/login', { usuario, password });
    const { access_token, nombre } = response.data;
    
    // Guardar en cookie (30 min)
    Cookies.set('access_token', access_token, { expires: 1/48 });
    Cookies.set('user', JSON.stringify({ usuario, nombre }), { expires: 1/48 });
    
    return response.data;
  },
  
  logout() {
    Cookies.remove('access_token');
    Cookies.remove('user');
  },
  
  getUser(): User | null {
    const userStr = Cookies.get('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  isAuthenticated(): boolean {
    return !!Cookies.get('access_token');
  }
};

// lib/api/client.ts - Interceptor
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authApi.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 6.2. Protección de Rutas

**Layout con Auth Guard:**

```typescript
// app/(dashboard)/dashboard/layout.tsx
'use client';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) return <div>Cargando...</div>;
  
  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <main>{children}</main>
    </div>
  );
}
```

---

## 7. 📊 Arquitectura de Datos

### 7.1. State Management con React Query

**Configuración:**

```typescript
// app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 segundos
      refetchOnWindowFocus: false,
    },
  },
});
```

**Uso en Componentes:**

```typescript
// Dashboard: Mostrar indicadores
const { data: indicadores } = useQuery({
  queryKey: ['presupuestos', 'indicadores'],
  queryFn: presupuestosApi.getIndicadores,
});

// Presupuestos: Lista pendientes
const { data: pendientes } = useQuery({
  queryKey: ['presupuestos', 'pendientes'],
  queryFn: () => presupuestosApi.getPendientes(),
  enabled: activeTab === 'pendientes',
});

// Aprobar presupuesto
const aprobarMutation = useMutation({
  mutationFn: presupuestosApi.aprobar,
  onSuccess: () => {
    queryClient.invalidateQueries(['presupuestos']);
    toast.success('Presupuesto aprobado');
  },
});
```

### 7.2. Tipado TypeScript

```typescript
// lib/types/presupuesto.ts
export interface Presupuesto {
  Loc_cod: number;
  pre_nro: number;
  Pre_Cliente: string;
  Pre_monto: number;
  Pre_fec: string;
  Pre_vbLib: number;
  pre_vbgg: number;
  pre_vbggDt?: string;
  pre_vbggTime?: string;
  pre_vbggUsu?: string;
}

export interface Indicadores {
  total: number;
  pendientes: number;
  aprobados: number;
}

export interface AprobarRequest {
  Loc_cod: number;
  pre_nro: number;
}
```

---

## 8. 🎨 Diseño y UI

### 8.1. Paleta de Colores (Dark Mode)

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: 'rgb(94, 200, 242)',    // Turquesa
        secondary: 'rgb(69, 162, 154)',  // Teal
        background: 'rgb(15, 23, 42)',   // slate-900
        surface: 'rgb(30, 41, 59)',      // slate-800
        border: 'rgb(51, 65, 85)',       // slate-700
      },
    },
  },
};
```

### 8.2. Componentes Estándar

**Card de Indicador:**
```tsx
<div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6">
  <div className="flex items-center justify-between">
    <FileText className="h-8 w-8 text-cyan-400" />
    <span className="text-3xl font-bold">{count}</span>
  </div>
  <h3 className="text-slate-400 mt-2">Título</h3>
</div>
```

**Tabla Responsiva:**
```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead className="bg-slate-800">
      <tr>
        <th className="px-6 py-3 text-left text-slate-300">Columna</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-700">
      {items.map(item => (
        <tr key={item.id} className="hover:bg-slate-800">
          <td className="px-6 py-4">{item.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## 9. 📝 Checklist para Nuevo Proyecto

### Pre-requisitos
- [ ] VPS con Docker instalado
- [ ] Dominio apuntando al VPS (registro A)
- [ ] Nginx proxy centralizado configurado (`general-net` network)
- [ ] Cuenta Docker Hub activa
- [ ] Backend API en producción

### Configuración Inicial
- [ ] Crear repositorio en GitHub
- [ ] Clonar proyecto base Next.js
- [ ] Instalar dependencias: `npm install`
- [ ] Configurar `.env.local` para desarrollo
- [ ] Configurar `.env.production` con URL de producción

### Dockerfile
- [ ] Crear Dockerfile multi-stage (deps, builder, runner)
- [ ] Definir `ARG` y `ENV` para `NEXT_PUBLIC_API_URL` en builder
- [ ] Configurar `output: 'standalone'` en `next.config.ts`
- [ ] Crear `.dockerignore`

### Docker Compose
- [ ] Crear `docker-compose.prod.yml`
- [ ] Configurar health check
- [ ] Añadir a network `general-net`

### Nginx
- [ ] Crear config en `nginx/conf.d/[dominio].conf`
- [ ] Configurar proxy_pass al contenedor
- [ ] Definir server_name con dominio

### GitHub Actions
- [ ] Copiar `.github/workflows/docker-publish.yml`
- [ ] Actualizar nombres de imagen Docker
- [ ] Configurar 6 secrets en GitHub

### SSH Keys
- [ ] Generar par de claves: `ssh-keygen -t ed25519`
- [ ] Copiar pública a VPS: `~/.ssh/authorized_keys`
- [ ] Copiar privada a GitHub Secret `VPS_SSH_KEY`

### Primer Deploy
- [ ] Commit y push inicial
- [ ] Crear tag: `git tag -a v1.0.0 -m "Initial release"`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] Monitorear workflow en GitHub Actions

### Post-Deploy
- [ ] Verificar contenedor: `docker ps`
- [ ] Probar HTTP: `curl http://[dominio]`
- [ ] Obtener certificado SSL con certbot
- [ ] Actualizar config nginx con SSL
- [ ] Recargar nginx
- [ ] Verificar HTTPS: `curl https://[dominio]`

---

## 10. 🔧 Comandos Útiles

### Docker
```bash
# Ver contenedores
docker ps

# Logs del contenedor
docker logs -f mcn_frontend

# Reiniciar contenedor
docker compose restart

# Rebuild forzado
docker compose up -d --force-recreate --build

# Eliminar todo y recrear
docker compose down && docker compose up -d
```

### Nginx
```bash
# Test de configuración
docker exec nginx_proxy nginx -t

# Recargar sin downtime
docker exec nginx_proxy nginx -s reload

# Ver logs
docker exec nginx_proxy tail -f /var/log/nginx/error.log

# Listar certificados
docker exec nginx_certbot certbot certificates
```

### SSH/SCP
```bash
# Conectar con clave específica
ssh -i github-actions-deploy-frontend root@168.231.96.205

# Copiar archivo
scp -i github-actions-deploy-frontend archivo.txt root@168.231.96.205:/ruta/

# Ejecutar comando remoto
ssh -i clave root@ip "comando"
```

### Git
```bash
# Ver tags
git tag -l

# Eliminar tag local y remoto
git tag -d v1.0.0
git push origin --delete v1.0.0

# Crear tag anotado
git tag -a v1.0.1 -m "Descripción"
git push origin v1.0.1
```

---

## 11. 🐛 Problemas Comunes y Soluciones

| Problema | Causa | Solución |
| :--- | :--- | :--- |
| API retorna 401 | Token expirado o inválido | Logout y re-login |
| `localhost:8000` en producción | Variable no definida en build | Añadir `ARG/ENV` en Dockerfile builder stage |
| `docker-compose: command not found` | VPS usa v2 (plugin) | Cambiar a `docker compose` (espacio) |
| Certificado SSL no existe | Certbot no ejecutado | Correr certbot manualmente con cuenta correcta |
| Nginx test failed | Sintaxis incorrecta | Verificar escapes de `$` en proxy_set_header |
| Cannot load certificate | Ruta incorrecta | Verificar volúmenes compartidos con certbot |
| SSH authentication failed | Clave incorrecta | Regenerar par de claves y actualizar ambos lados |
| Build tarda mucho | Cache inválido | Usar `--no-cache` o verificar layers |
| Puerto 3000 en uso | Contenedor anterior corriendo | `docker compose down` antes de `up` |
| Health check failing | Ruta incorrecta | Verificar endpoint `/api/health` existe |

---

## 12. 📚 Referencias

- **Repositorio:** https://github.com/mmoyac/mcn_aprobaciones_frontend
- **Docker Hub:** https://hub.docker.com/r/mmoyac/mcn_aprobaciones_frontend
- **Producción:** https://aprobaciones.lexastech.cl
- **API Backend:** https://api.lexastech.cl
- **Next.js Docs:** https://nextjs.org/docs
- **Docker Compose:** https://docs.docker.com/compose/
- **Let's Encrypt:** https://letsencrypt.org/

---

**Última actualización:** Diciembre 2025  
**Versión actual:** v1.0.8  
**Estado:** ✅ Producción estable  