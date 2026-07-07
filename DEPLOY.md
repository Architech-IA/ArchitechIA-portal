# Deploy — ArchitechIA Portal

## Infraestructura

| Componente | Detalle |
|---|---|
| VPS | Hostinger KVM2 — `177.7.46.87` |
| Dominio | `https://portal.architechia.co` |
| Proceso | pm2 — `portal-architechia` (puerto 3003) |
| Reverse proxy | nginx con SSL (Let's Encrypt, auto-renovación) |

## CI/CD automático

Cada push a `main` dispara un deploy automático vía webhook:

```
push a main → GitHub → https://portal.architechia.co/deploy-hook → VPS
```

El webhook server corre como proceso pm2 (`deploy-webhook`, puerto 9001).  
Los logs de cada deploy quedan en `/var/log/deploy.log` en el VPS.

### Webhook configurado en GitHub
- URL: `https://portal.architechia.co/deploy-hook`
- Evento: `push` a `main`
- Secret: guardado en el VPS en `/root/deploy-webhook/server.js`

### Script de deploy
`/root/deploy-webhook/deploy.sh` ejecuta:
1. `git pull origin main`
2. `npm ci`
3. `npx prisma generate`
4. `npm run build`
5. `pm2 restart portal-architechia`

## Comandos útiles en el VPS

```bash
# Ver estado de los procesos
pm2 list

# Ver logs del portal
pm2 logs portal-architechia

# Ver logs de deploys
tail -f /var/log/deploy.log

# Reiniciar manualmente
pm2 restart portal-architechia --update-env

# Deploy manual (sin push)
bash /root/deploy-webhook/deploy.sh
```

## Variables de entorno

El archivo `.env` vive en `/root/portal-architechia/.env` y **no está en git**.  
Variables requeridas:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Supabase connection string (pgbouncer) |
| `DIRECT_URL` | Supabase direct connection |
| `NEXTAUTH_SECRET` | Secret para JWT de NextAuth |
| `NEXTAUTH_URL` | `https://portal.architechia.co` |
| `GOOGLE_CLIENT_ID` | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `GOOGLE_PLACES_API_KEY` | Autocomplete de ciudades en Prospecting |
| `VPS_METRICS_URL` | URL del agente de métricas (hub/operations) |
| `VPS_METRICS_TOKEN` | Token del agente de métricas |

## Si el portal está caído

```bash
ssh root@177.7.46.87
source ~/.nvm/nvm.sh
pm2 resurrect        # restaurar desde dump guardado
# o si no funciona:
cd /root/portal-architechia
pm2 start npm --name portal-architechia -- start -- -p 3003
```
