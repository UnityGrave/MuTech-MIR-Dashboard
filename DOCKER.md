# Docker Guide - Pitch Visualizer

This document provides comprehensive instructions for running the Pitch Visualizer application using Docker containers.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [CI/CD](#cicd)
- [Performance Tuning](#performance-tuning)

---

## Prerequisites

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher (included with Docker Desktop)
- **Docker Desktop** (recommended for Windows/macOS)
- **4GB RAM** available for Docker

### Verify Installation

```bash
docker --version
docker compose version
```

---

## Quick Start

### Development (with Hot Reload)

```bash
# Start development environment
docker compose -f docker-compose.dev.yml up

# Access the application
# Open http://localhost:5173 in your browser
```

### Production

```bash
# Build and start production environment
docker compose up -d

# Access the application
# Open http://localhost:8080 in your browser
```

---

## Development Environment

### Starting Development Server

```bash
# Using Docker Compose (recommended)
docker compose -f docker-compose.dev.yml up

# Or build and run manually
docker build -f Dockerfile.dev -t pitch-visualizer:dev .
docker run -p 5173:5173 -v ${PWD}:/app -v /app/node_modules pitch-visualizer:dev
```

### Features

- **Hot Module Replacement (HMR)**: Changes to source files automatically refresh the browser
- **Volume Mounting**: Source code is mounted from host, no rebuild needed for code changes
- **Preserved node_modules**: Dependencies are installed in a Docker volume to avoid conflicts

### Rebuilding After Package Changes

If you modify `package.json`, rebuild the container:

```bash
docker compose -f docker-compose.dev.yml up --build
```

### Viewing Logs

```bash
# Follow logs
docker compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker logs pitch-visualizer-dev -f
```

### Stopping Development Server

```bash
docker compose -f docker-compose.dev.yml down
```

---

## Production Environment

### Building Production Image

```bash
# Build with Docker Compose
docker compose build

# Or build manually
docker build -t pitch-visualizer:latest .
```

### Running Production Container

```bash
# Using Docker Compose
docker compose up -d

# Or run manually
docker run -d -p 8080:8080 --name pitch-visualizer pitch-visualizer:latest
```

### Health Checks

The production container includes health check endpoints:

```bash
# Check health
curl http://localhost:8080/health

# Check readiness
curl http://localhost:8080/ready
```

### Container Management

```bash
# View running containers
docker ps

# View container logs
docker logs pitch-visualizer-prod -f

# Stop container
docker compose down

# Restart container
docker compose restart
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Host Machine                              │
│                                                              │
│  Development:                   Production:                  │
│  ┌─────────────────────┐       ┌─────────────────────┐      │
│  │ pitch-visualizer-dev│       │ pitch-visualizer    │      │
│  │                     │       │                     │      │
│  │ ┌─────────────────┐│       │ ┌─────────────────┐│      │
│  │ │  Node.js        ││       │ │  Nginx          ││      │
│  │ │  Vite Dev Server││       │ │  Alpine Linux   ││      │
│  │ │  Port 5173      ││       │ │  Port 8080      ││      │
│  │ └─────────────────┘│       │ └─────────────────┘│      │
│  │         ↑          │       │         ↑          │      │
│  │    Volume Mount    │       │    Static Files    │      │
│  │    (live code)     │       │    (built dist/)   │      │
│  └─────────────────────┘       └─────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Image Sizes

| Image | Base | Approximate Size |
|-------|------|------------------|
| Development | node:20-alpine | ~300MB |
| Production | nginx:alpine | ~40MB |

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `VITE_HMR_HOST` | HMR host for Docker | `localhost` |

### Ports

| Environment | Host Port | Container Port |
|-------------|-----------|----------------|
| Development | 5173 | 5173 |
| Production | 8080 | 8080 |

### Custom Port Mapping

To use a different host port, modify `docker-compose.yml`:

```yaml
ports:
  - "3000:8080"  # Access via http://localhost:3000
```

---

## Troubleshooting

### Hot Reload Not Working

**Symptom**: File changes don't trigger browser refresh

**Solutions**:

1. **WSL2/Windows**: File polling is enabled by default. If still not working:
   ```bash
   # Set environment variable
   CHOKIDAR_USEPOLLING=true docker compose -f docker-compose.dev.yml up
   ```

2. **macOS**: Ensure Docker Desktop has file sharing enabled for the project directory

3. **Rebuild container**:
   ```bash
   docker compose -f docker-compose.dev.yml down
   docker compose -f docker-compose.dev.yml up --build
   ```

### Port Already in Use

**Symptom**: Error `bind: address already in use`

**Solution**: Use a different port:

```bash
# For development
docker run -p 5174:5173 pitch-visualizer:dev

# Or modify docker-compose.dev.yml
ports:
  - "5174:5173"
```

### Permission Denied on Volumes

**Symptom**: Container can't write to mounted volumes

**Solutions**:

1. **Linux**: Match container user ID with host:
   ```bash
   docker run -u $(id -u):$(id -g) ...
   ```

2. **Check volume permissions**:
   ```bash
   ls -la ./
   ```

### AudioWorklet Not Loading

**Symptom**: Pitch detection doesn't work in container

**Solutions**:

1. **Check CORS headers**: Nginx is configured to send required headers. Verify:
   ```bash
   curl -I http://localhost:8080/
   # Should show Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers
   ```

2. **Use HTTPS**: Some browsers require HTTPS for AudioWorklet. Consider using a reverse proxy with SSL.

### Container Won't Start

**Symptom**: Container exits immediately

**Debug**:
```bash
# View exit logs
docker logs pitch-visualizer-prod

# Run interactively to see errors
docker run -it pitch-visualizer:latest sh
```

### Slow Builds on macOS

**Symptom**: Build takes very long

**Solution**: Use Docker BuildKit:
```bash
DOCKER_BUILDKIT=1 docker build -t pitch-visualizer:latest .
```

---

## Security

### Non-Root User

The production container runs as a non-root user (`appuser`, UID 1001):

```bash
# Verify
docker exec pitch-visualizer-prod whoami
# Output: appuser
```

### Security Scanning

Scan images for vulnerabilities:

```bash
# Using Docker Scout
docker scout cves pitch-visualizer:latest

# Using Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image pitch-visualizer:latest
```

### Security Headers

Nginx is configured with security headers:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## CI/CD

### GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/docker-build.yml`) that:

1. Builds Docker image on push to main/develop
2. Tags images with branch name, commit SHA, and semantic version
3. Pushes to GitHub Container Registry
4. Runs security vulnerability scanning

### Pulling Published Images

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/YOUR_USERNAME/mutech-mir-dashboard:latest

# Run the published image
docker run -p 8080:8080 ghcr.io/YOUR_USERNAME/mutech-mir-dashboard:latest
```

### Manual Registry Push

```bash
# Tag for registry
docker tag pitch-visualizer:latest ghcr.io/YOUR_USERNAME/pitch-visualizer:v1.0.0

# Login to registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Push
docker push ghcr.io/YOUR_USERNAME/pitch-visualizer:v1.0.0
```

---

## Performance Tuning

### Build Cache

Enable BuildKit for faster builds:

```bash
export DOCKER_BUILDKIT=1
docker build -t pitch-visualizer:latest .
```

### Resource Limits

Adjust resource limits in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
```

### Image Size Optimization

Current production image is ~40MB. Further optimization:

1. Use `.dockerignore` to exclude unnecessary files (already configured)
2. Multi-stage build separates build and runtime (already implemented)
3. Alpine-based images for minimal footprint (already using)

### Monitoring

```bash
# Container resource usage
docker stats pitch-visualizer-prod

# Container health status
docker inspect --format='{{json .State.Health}}' pitch-visualizer-prod | jq
```

---

## Cloud Deployment

### AWS ECS

```bash
# Build and tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker tag pitch-visualizer:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/pitch-visualizer:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/pitch-visualizer:latest
```

### Google Cloud Run

```bash
# Build and push to Google Container Registry
gcloud auth configure-docker
docker tag pitch-visualizer:latest gcr.io/YOUR_PROJECT/pitch-visualizer:latest
docker push gcr.io/YOUR_PROJECT/pitch-visualizer:latest

# Deploy to Cloud Run
gcloud run deploy pitch-visualizer \
  --image gcr.io/YOUR_PROJECT/pitch-visualizer:latest \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated
```

### DigitalOcean App Platform

1. Push code to GitHub
2. Connect repository in DigitalOcean dashboard
3. Select Dockerfile deployment
4. Configure port 8080

---

## Common Commands Reference

```bash
# Development
docker compose -f docker-compose.dev.yml up          # Start dev server
docker compose -f docker-compose.dev.yml up --build  # Rebuild and start
docker compose -f docker-compose.dev.yml down        # Stop dev server
docker compose -f docker-compose.dev.yml logs -f     # View logs

# Production
docker compose up -d                                  # Start production
docker compose up --build -d                          # Rebuild and start
docker compose down                                   # Stop production
docker compose logs -f                                # View logs
docker compose restart                                # Restart

# Image Management
docker images | grep pitch                            # List images
docker rmi pitch-visualizer:latest                    # Remove image
docker system prune                                   # Clean up unused resources

# Debugging
docker exec -it pitch-visualizer-prod sh              # Shell into container
docker inspect pitch-visualizer-prod                  # View container details
docker stats                                          # Resource usage
```

