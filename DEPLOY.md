# 🚀 Guía de Despliegue - MCN Aprobaciones Frontend

## 📋 Checklist Pre-Despliegue

### 1. Verificar Repositorio en GitHub

```bash
# Navegar al directorio del frontend
cd d:\ProyectosAI\LexasTech\mcn_aprobaciones_frontend

# Inicializar git si no existe
git init

# Crear repositorio en GitHub: mcn_aprobaciones_frontend
# Luego conectar:
git remote add origin https://github.com/mmoyac/mcn_aprobaciones_frontend.git
git branch -M main

# Agregar todos los archivos
git add .
git commit -m "feat: configuración inicial del frontend con Next.js y despliegue Docker"
git push -u origin main
```

### 2. Configurar Secrets en GitHub

Ve a: `https://github.com/mmoyac/mcn_aprobaciones_frontend/settings/secrets/actions`

Agregar los siguientes secrets:

| Secret | Valor | Descripción |
|--------|-------|-------------|
| `DOCKER_USERNAME` | `mmoyac` | Usuario de Docker Hub |
| `DOCKER_PASSWORD` | `[tu-token]` | Access Token de Docker Hub |
| `VPS_HOST` | `168.231.96.205` | IP del VPS |
| `VPS_USERNAME` | `root` | Usuario SSH |
| `VPS_SSH_KEY` | `[clave-privada]` | Clave privada SSH completa |
| `VPS_PORT` | `22` | Puerto SSH |

### 3. Preparar VPS

Conectar al VPS por SSH:

```bash
ssh root@168.231.96.205
```

Ejecutar en el VPS:

```bash
# Crear directorios
mkdir -p /root/docker/mcn-frontend
mkdir -p /root/docker/nginx-proxy/conf.d

# Verificar que la red general-net existe
docker network ls | grep general-net

# Si no existe, crearla:
docker network create general-net

# Verificar que nginx-proxy está corriendo
docker ps | grep nginx-proxy

# Si no está corriendo, iniciarlo:
cd /root/docker/nginx-proxy
docker-compose up -d
```

## 🚀 Despliegue Automático

### Opción 1: Ejecución Manual (Recomendada)

1. Ve a GitHub Actions:
   ```
   https://github.com/mmoyac/mcn_aprobaciones_frontend/actions
   ```

2. Selecciona el workflow: **"Build and Push to Docker Hub"**

3. Click en **"Run workflow"**

4. Selecciona branch: `main`

5. Click en **"Run workflow"** verde

6. Espera 5-10 minutos a que complete

### Opción 2: Con Tag de Versión

```bash
# Crear tag de versión
git tag -a v1.0.0 -m "Release inicial - Sistema de aprobaciones"
git push origin v1.0.0

# El workflow se ejecutará automáticamente
```

## 🔍 Verificación del Despliegue

### 1. Verificar Build en GitHub Actions

- ✅ Build completado sin errores
- ✅ Imagen subida a Docker Hub
- ✅ Deploy en VPS exitoso

### 2. Verificar en Docker Hub

```
https://hub.docker.com/r/mmoyac/mcn_aprobaciones_frontend
```

### 3. Verificar en VPS

```bash
# Conectar al VPS
ssh root@168.231.96.205

# Ver contenedor corriendo
docker ps | grep mcn_frontend

# Ver logs
cd /root/docker/mcn-frontend
docker-compose logs -f frontend

# Ver configuración de Nginx
cat /root/docker/nginx-proxy/conf.d/aprobaciones.lexastech.cl.conf

# Verificar Nginx
docker exec nginx-proxy nginx -t
```

### 4. Verificar Certificado SSL

```bash
# En el VPS, obtener certificado
docker exec nginx-proxy certbot --nginx \
  -d aprobaciones.lexastech.cl \
  --non-interactive \
  --agree-tos \
  -m mmoyac@lexastech.cl

# Verificar renovación automática
docker exec nginx-proxy certbot renew --dry-run
```

### 5. Verificar DNS

Asegurarse que el registro A apunta al VPS:

```
aprobaciones.lexastech.cl  →  168.231.96.205
```

### 6. Probar Aplicación

```bash
# Desde terminal local
curl -I https://aprobaciones.lexastech.cl

# Debería retornar: HTTP/2 200
```

Abrir en navegador: **https://aprobaciones.lexastech.cl**

## 🔄 Actualizar Aplicación

Para futuras actualizaciones:

```bash
# 1. Hacer cambios en el código
# 2. Commit y push
git add .
git commit -m "feat: nueva funcionalidad"
git push

# 3. Crear nuevo tag
git tag -a v1.0.1 -m "Actualización con nuevas funcionalidades"
git push origin v1.0.1

# O ejecutar manualmente desde GitHub Actions
```

## 🐛 Troubleshooting

### Contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs frontend

# Verificar health check
docker inspect mcn_frontend | grep -A 10 Health

# Reiniciar contenedor
docker-compose restart frontend
```

### Nginx no encuentra upstream

```bash
# Verificar que el contenedor está en la red correcta
docker inspect mcn_frontend | grep -A 10 Networks

# Debe mostrar: general-net

# Verificar conectividad
docker exec nginx-proxy ping -c 3 mcn_frontend
```

### SSL no funciona

```bash
# Renovar certificado
docker exec nginx-proxy certbot renew --force-renewal

# Recargar Nginx
docker exec nginx-proxy nginx -s reload
```

### Aplicación no carga datos

```bash
# Verificar que el backend esté corriendo
curl https://api.lexastech.cl/health

# Verificar variable de entorno en contenedor
docker exec mcn_frontend env | grep NEXT_PUBLIC_API_URL

# Debe mostrar: https://api.lexastech.cl/api/v1
```

## 📊 Monitoreo

### Ver logs en tiempo real

```bash
# Frontend
docker-compose logs -f frontend

# Nginx
docker exec nginx-proxy tail -f /var/log/nginx/aprobaciones.lexastech.cl.access.log
docker exec nginx-proxy tail -f /var/log/nginx/aprobaciones.lexastech.cl.error.log
```

### Verificar uso de recursos

```bash
docker stats mcn_frontend
```

## ✅ Checklist Post-Despliegue

- [ ] Aplicación accesible en https://aprobaciones.lexastech.cl
- [ ] Certificado SSL válido (candado verde)
- [ ] Login funciona correctamente
- [ ] Dashboard muestra indicadores
- [ ] Lista de presupuestos pendientes funciona
- [ ] Aprobación de presupuestos funciona
- [ ] Logout funciona correctamente
- [ ] Todas las rutas redirigen correctamente
- [ ] No hay errores en consola del navegador
- [ ] Logs del contenedor sin errores críticos

## 🎉 ¡Listo!

La aplicación debería estar funcionando en:

**https://aprobaciones.lexastech.cl**

Usuario de prueba: alberto
Password: (el que está en la BD)
