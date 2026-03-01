/**
 * On-Premises Deployment Toolkit
 * 
 * Docker configuration, deployment scripts, and infrastructure for enterprise on-premises部署.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Docker configuration
 */
export interface DockerConfig {
  /** Image name */
  imageName: string;
  /** Image tag */
  tag: string;
  /** Port mappings */
  ports: PortMapping[];
  /** Environment variables */
  env: EnvironmentVariable[];
  /** Volume mounts */
  volumes: VolumeMount[];
  /** Resource limits */
  resources: ResourceLimits;
  /** Health check */
  healthCheck: HealthCheck;
  /** Build args */
  buildArgs: Record<string, string>;
}

/**
 * Port mapping
 */
export interface PortMapping {
  container: number;
  host: number;
  protocol: 'tcp' | 'udp';
}

/**
 * Environment variable
 */
export interface EnvironmentVariable {
  key: string;
  value: string;
  secret?: boolean;
}

/**
 * Volume mount
 */
export interface VolumeMount {
  containerPath: string;
  hostPath: string;
  readonly?: boolean;
}

/**
 * Resource limits
 */
export interface ResourceLimits {
  /** Memory limit (MB) */
  memoryMB: number;
  /** CPU limit (cores) */
  cpuCores: number;
  /** Storage limit (GB) */
  storageGB: number;
}

/**
 * Health check configuration
 */
export interface HealthCheck {
  /** Health check command */
  command: string;
  /** Interval in seconds */
  interval: number;
  /** Timeout in seconds */
  timeout: number;
  /** Retries before unhealthy */
  retries: number;
  /** Start period in seconds */
  startPeriod: number;
}

/**
 * Docker Compose configuration
 */
export interface DockerComposeConfig {
  version: string;
  services: Record<string, DockerService>;
  networks: Record<string, NetworkConfig>;
  volumes: Record<string, VolumeConfig>;
}

/**
 * Docker service
 */
export interface DockerService {
  build?: string | { context: string; dockerfile: string; args: Record<string, string> };
  image?: string;
  container_name?: string;
  ports?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  resources?: {
    limits?: { cpus: string; memory: string };
    reservations?: { cpus: string; memory: string };
  };
  healthcheck?: {
    test: string | string[];
    interval: string;
    timeout: string;
    retries: number;
    start_period: string;
  };
  depends_on?: string[];
  networks?: string[];
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  driver: 'bridge' | 'host' | 'overlay' | 'macvlan';
  ipam?: {
    driver: string;
    config: { subnet: string; gateway: string }[];
  };
}

/**
 * Volume configuration
 */
export interface VolumeConfig {
  driver: string;
  driver_opts?: Record<string, string>;
}

/**
 * Kubernetes configuration
 */
export interface KubernetesConfig {
  apiVersion: string;
  kind: string;
  metadata: { name: string };
  spec: K8sSpec;
}

export interface K8sSpec {
  replicas: number;
  selector: { matchLabels: Record<string, string> };
  template: {
    metadata: { labels: Record<string, string> };
    spec: K8sPodSpec;
  };
}

export interface K8sPodSpec {
  containers: K8sContainer[];
  volumes?: K8sVolume[];
}

export interface K8sContainer {
  name: string;
  image: string;
  ports: { containerPort: number; protocol: string }[];
  env?: { name: string; value: string }[];
  resources?: {
    limits?: { cpu: string; memory: string };
    requests?: { cpu: string; memory: string };
  };
  livenessProbe?: K8sProbe;
  readinessProbe?: K8sProbe;
}

export interface K8sVolume {
  name: string;
  persistentVolumeClaim?: { claimName: string };
  configMap?: { name: string };
  secret?: { secretName: string };
}

export interface K8sProbe {
  httpGet?: { path: string; port: number };
  tcpSocket?: { port: number };
  exec?: { command: string[] };
  initialDelaySeconds: number;
  periodSeconds: number;
  timeoutSeconds: number;
}

/**
 * Generate Docker configuration
 */
export function generateDockerfile(config: {
  baseImage?: string;
  nodeVersion?: string;
  app?: string;
}):Path string {
  const nodeVersion = config.nodeVersion || '20-alpine';
  const appPath = config.appPath || '/app';

  return `# DocsJS Enterprise Docker Image
FROM node:${nodeVersion}

# Set working directory
WORKDIR ${appPath}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S docsjs && \\
    adduser -S docsjs -u 1001 -G docsjs

# Set ownership
RUN chown -R docsjs:docsjs ${appPath}

# Switch to non-root user
USER docsjs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start command
CMD ["node", "dist/server/server.js"]
`;
}

/**
 * Generate Docker Compose file
 */
export function generateDockerCompose(services: {
  app?: Partial<DockerService>;
  redis?: boolean;
  postgres?: boolean;
}): DockerComposeConfig {
  const config: DockerComposeConfig = {
    version: '3.8',
    services: {
      docsjs: {
        build: { context: '.', dockerfile: 'Dockerfile' },
        container_name: 'docsjs-enterprise',
        ports: ['3000:3000', '3001:3001'],
        environment: {
          NODE_ENV: 'production',
          LOG_LEVEL: 'info',
          REDIS_URL: services.redis ? 'redis://redis:6379' : '',
          DATABASE_URL: services.postgres ? 'postgresql://docsjs:password@postgres:5432/docsjs' : ''
        },
        volumes: ['docsjs-data:/app/data', 'docsjs-logs:/app/logs'],
        resources: {
          limits: { cpus: '2', memory: '2G' },
          reservations: { cpus: '0.5', memory: '512M' }
        },
        healthcheck: {
          test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/v1/health'],
          interval: '30s',
          timeout: '10s',
          retries: 3,
          start_period: '30s'
        },
        networks: ['docsjs-network']
      }
    },
    networks: {
      docsjsNetwork: { driver: 'bridge' }
    },
    volumes: {
      docsjsData: { driver: 'local' },
      docsjsLogs: { driver: 'local' }
    }
  };

  if (services.redis) {
    config.services.redis = {
      image: 'redis:7-alpine',
      container_name: 'docsjs-redis',
      ports: ['6379:6379'],
      volumes: ['redis-data:/data'],
      networks: ['docsjs-network']
    };
    config.volumes.redisData = { driver: 'local' };
  }

  if (services.postgres) {
    config.services.postgres = {
      image: 'postgres:15-alpine',
      container_name: 'docsjs-postgres',
      environment: {
        POSTGRES_DB: 'docsjs',
        POSTGRES_USER: 'docsjs',
        POSTGRES_PASSWORD: 'password'
      },
      volumes: ['postgres-data:/var/lib/postgresql/data'],
      networks: ['docsjs-network']
    };
    config.volumes.postgresData = { driver: 'local' };
  }

  return config;
}

/**
 * Generate Kubernetes deployment
 */
export function generateKubernetesManifest(name: string, opts: {
  replicas?: number;
  image?: string;
  port?: number;
  memoryLimit?: string;
  cpuLimit?: string;
}): KubernetesConfig {
  return {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: { name },
    spec: {
      replicas: opts.replicas || 3,
      selector: { matchLabels: { app: name } },
      template: {
        metadata: { labels: { app: name } },
        spec: {
          containers: [{
            name,
            image: opts.image || 'docsjs/enterprise:latest',
            ports: [{ containerPort: opts.port || 3000, protocol: 'TCP' }],
            env: [
              { name: 'NODE_ENV', value: 'production' }
            ],
            resources: {
              limits: {
                cpu: opts.cpuLimit || '1',
                memory: opts.memoryLimit || '1Gi'
              },
              requests: {
                cpu: '250m',
                memory: '256Mi'
              }
            },
            livenessProbe: {
              httpGet: { path: '/api/v1/health', port: 3000 },
              initialDelaySeconds: 30,
              periodSeconds: 10,
              timeoutSeconds: 5
            },
            readinessProbe: {
              httpGet: { path: '/api/v1/health', port: 3000 },
              initialDelaySeconds: 10,
              periodSeconds: 5,
              timeoutSeconds: 3
            }
          }]
        }
      }
    }
  };
}

/**
 * Generate Helm values
 */
export function generateHelmValues(name: string): Record<string, unknown> {
  return {
    replicaCount: 3,
    image: {
      repository: 'docsjs/enterprise',
      tag: 'latest',
      pullPolicy: 'IfNotPresent'
    },
    service: {
      type: 'ClusterIP',
      port: 3000,
      annotations: {}
    },
    ingress: {
      enabled: true,
      className: 'nginx',
      annotations: {
        'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
        'nginx.ingress.kubernetes.io/ssl-redirect': 'true'
      },
      hosts: [{ host: `${name}.example.com`, paths: [{ path: '/', pathType: 'Prefix' }] }],
      tls: [{ secretName: `${name}-tls`, hosts: [`${name}.example.com`] }]
    },
    resources: {
      limits: { cpu: '1000m', memory: '1Gi' },
      requests: { cpu: '250m', memory: '256Mi' }
    },
    persistence: {
      enabled: true,
      storageClass: 'standard',
      accessMode: 'ReadWriteOnce',
      size: '10Gi'
    },
    autoscaling: {
      enabled: true,
      minReplicas: 2,
      maxReplicas: 10,
      targetCPUUtilizationPercentage: 70
    }
  };
}

/**
 * Generate nginx ingress
 */
export function generateNginxIngress(name: string): string {
  return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${name}
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
spec:
  ingressClassName: nginx
  rules:
  - host: ${name}.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${name}
            port:
              number: 3000
  tls:
  - hosts:
    - ${name}.example.com
    secretName: ${name}-tls
`;
}

/**
 * Generate deployment scripts
 */
export function generateDeploymentScripts() {
  return {
    'docker-compose.yml': generateDockerCompose({ redis: true, postgres: true }),
    'Dockerfile': generateDockerfile({}),
    'deploy.sh': `#!/bin/bash
set -e

echo "Deploying DocsJS Enterprise..."

# Build image
docker build -t docsjs/enterprise:latest .

# Start services
docker-compose up -d

# Check health
echo "Checking health..."
sleep 10
curl -f http://localhost:3000/api/v1/health || exit 1

echo "Deployment complete!"`,

    'kubernetes/deployment.yaml': generateKubernetesManifest('docsjs'),
    'kubernetes/ingress.yaml': generateNginxIngress('docsjs'),
    'kubernetes/values.yaml': generateHelmValues('docsjs')
  };
}

/**
 * On-premises deployment manager
 */
export class OnPremisesDeploymentManager {
  private config: DockerConfig;
  private outputDir: string;

  constructor(outputDir: string = './deployment') {
    this.outputDir = outputDir;
    this.config = this.defaultConfig();
  }

  private defaultConfig(): DockerConfig {
    return {
      imageName: 'docsjs/enterprise',
      tag: 'latest',
      ports: [
        { container: 3000, host: 3000, protocol: 'tcp' },
        { container: 3001, host: 3001, protocol: 'tcp' }
      ],
      env: [
        { key: 'NODE_ENV', value: 'production' },
        { key: 'LOG_LEVEL', value: 'info' }
      ],
      volumes: [
        { containerPath: '/app/data', hostPath: './data', readonly: false },
        { containerPath: '/app/logs', hostPath: './logs', readonly: false }
      ],
      resources: {
        memoryMB: 2048,
        cpuCores: 2,
        storageGB: 50
      },
      healthCheck: {
        command: 'curl -f http://localhost:3000/api/v1/health',
        interval: 30,
        timeout: 10,
        retries: 3,
        startPeriod: 30
      },
      buildArgs: {}
    };
  }

  /**
   * Generate all deployment files
   */
  generate(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    // Generate Dockerfile
    const dockerfile = generateDockerfile({});
    writeFileSync(resolve(this.outputDir, 'Dockerfile'), dockerfile);

    // Generate docker-compose
    const compose = generateDockerCompose({ redis: true, postgres: true });
    writeFileSync(
      resolve(this.outputDir, 'docker-compose.yml'),
      JSON.stringify(compose, null, 2)
    );

    // Generate K8s
    const k8sDir = resolve(this.outputDir, 'kubernetes');
    if (!existsSync(k8sDir)) {
      mkdirSync(k8sDir, { recursive: true });
    }

    const deployment = generateKubernetesManifest('docsjs');
    writeFileSync(resolve(k8sDir, 'deployment.yaml'), JSON.stringify(deployment, null, 2));

    const ingress = generateNginxIngress('docsjs');
    writeFileSync(resolve(k8sDir, 'ingress.yaml'), ingress);

    const values = generateHelmValues('docsjs');
    writeFileSync(resolve(k8sDir, 'values.yaml'), JSON.stringify(values, null, 2));

    console.log(`Generated deployment files in ${this.outputDir}`);
  }

  /**
   * Get Docker run command
   */
  getDockerRunCommand(): string {
    const parts = ['docker run -d'];

    // Ports
    for (const port of this.config.ports) {
      parts.push(`-p ${port.host}:${port.container}`);
    }

    // Environment
    for (const env of this.config.env) {
      parts.push(`-e ${env.key}=${env.value}`);
    }

    // Volumes
    for (const vol of this.config.volumes) {
      parts.push(`-v ${vol.hostPath}:${vol.containerPath}${vol.readonly ? ':ro' : ''}`);
    }

    // Resources
    parts.push(`--memory=${this.config.resources.memoryMB}m`);
    parts.push(`--cpus=${this.config.resources.cpuCores}`);

    // Image
    parts.push(`${this.config.imageName}:${this.config.tag}`);

    return parts.join(' \\\n  ');
  }
}
