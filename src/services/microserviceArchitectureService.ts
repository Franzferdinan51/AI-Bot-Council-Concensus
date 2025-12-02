export interface ServiceDefinition {
  name: string;
  version: string;
  port: number;
  host?: string;
  protocol: 'http' | 'https' | 'grpc' | 'websocket';
  dependencies: string[];
  healthCheck: {
    path: string;
    interval: number;
    timeout: number;
    retries: number;
  };
  scaling: {
    minInstances: number;
    maxInstances: number;
    cpuThreshold: number;
    memoryThreshold: number;
  };
  environment: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface ServiceInstance {
  id: string;
  serviceName: string;
  version: string;
  status: 'starting' | 'healthy' | 'unhealthy' | 'stopping' | 'stopped';
  host: string;
  port: number;
  health: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: number;
    responseTime?: number;
    error?: string;
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
  };
  registeredAt: number;
  lastHealthCheck: number;
}

export interface ServiceRegistry {
  services: Map<string, ServiceInstance[]>;
  serviceDefinitions: Map<string, ServiceDefinition>;
  healthChecks: Map<string, NodeJS.Timeout>;
}

export interface LoadBalancerStrategy {
  type: 'round-robin' | 'random' | 'least-connections' | 'weighted' | 'latency-based';
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export interface ServiceDiscoveryConfig {
  enabled: boolean;
  strategy: 'consul' | 'etcd' | 'zookeeper' | 'eureka' | 'custom';
  endpoints: string[];
  refreshInterval: number;
}

export class MicroserviceArchitectureService {
  private registry: ServiceRegistry = {
    services: new Map(),
    serviceDefinitions: new Map(),
    healthChecks: new Map()
  };
  private loadBalancer: LoadBalancerStrategy = { type: 'round-robin' };
  private circuitBreaker: CircuitBreakerConfig = {
    enabled: true,
    failureThreshold: 5,
    recoveryTimeout: 30000,
    monitoringPeriod: 10000
  };
  private serviceDiscovery: ServiceDiscoveryConfig = {
    enabled: false,
    strategy: 'custom',
    endpoints: [],
    refreshInterval: 30000
  };
  private roundRobinCounters: Map<string, number> = new Map();

  constructor() {}

  async registerService(definition: ServiceDefinition): Promise<void> {
    this.registry.serviceDefinitions.set(definition.name, definition);
    console.log(`[MicroserviceArchitecture] Registered service: ${definition.name} v${definition.version}`);
  }

  async discoverService(serviceName: string): Promise<ServiceInstance[]> {
    return this.registry.services.get(serviceName) || [];
  }

  async registerInstance(instance: Omit<ServiceInstance, 'id'>): Promise<string> {
    const id = `${instance.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const serviceInstance: ServiceInstance = {
      ...instance,
      id
    };

    if (!this.registry.services.has(instance.serviceName)) {
      this.registry.services.set(instance.serviceName, []);
    }

    this.registry.services.get(instance.serviceName)!.push(serviceInstance);

    // Start health check for this instance
    await this.startHealthCheck(serviceInstance);

    console.log(`[MicroserviceArchitecture] Registered instance: ${id}`);
    return id;
  }

  async deregisterInstance(serviceName: string, instanceId: string): Promise<void> {
    const instances = this.registry.services.get(serviceName);
    if (!instances) return;

    const index = instances.findIndex(i => i.id === instanceId);
    if (index !== -1) {
      const instance = instances[index];
      instance.status = 'stopped';

      // Stop health check
      const healthCheckKey = `${serviceName}:${instanceId}`;
      const healthCheck = this.registry.healthChecks.get(healthCheckKey);
      if (healthCheck) {
        clearInterval(healthCheck);
        this.registry.healthChecks.delete(healthCheckKey);
      }

      instances.splice(index, 1);
      console.log(`[MicroserviceArchitecture] Deregistered instance: ${instanceId}`);
    }
  }

  async getHealthyInstances(serviceName: string): Promise<ServiceInstance[]> {
    const instances = this.registry.services.get(serviceName) || [];
    return instances.filter(i => i.health.status === 'healthy');
  }

  async routeRequest(serviceName: string, request: any): Promise<ServiceInstance> {
    const instances = await this.getHealthyInstances(serviceName);

    if (instances.length === 0) {
      throw new Error(`No healthy instances available for service: ${serviceName}`);
    }

    return this.selectInstance(instances);
  }

  async checkServiceHealth(serviceName: string): Promise<{
    healthy: number;
    unhealthy: number;
    total: number;
    instances: Array<{
      id: string;
      status: string;
      health: string;
      lastCheck: number;
    }>;
  }> {
    const instances = this.registry.services.get(serviceName) || [];

    const health = {
      healthy: 0,
      unhealthy: 0,
      total: instances.length,
      instances: instances.map(i => ({
        id: i.id,
        status: i.status,
        health: i.health.status,
        lastCheck: i.lastHealthCheck
      }))
    };

    instances.forEach(i => {
      if (i.health.status === 'healthy') {
        health.healthy++;
      } else {
        health.unhealthy++;
      }
    });

    return health;
  }

  async scaleService(serviceName: string, targetInstances: number): Promise<void> {
    const definition = this.registry.serviceDefinitions.get(serviceName);
    if (!definition) {
      throw new Error(`Service definition not found: ${serviceName}`);
    }

    const currentInstances = this.registry.services.get(serviceName) || [];
    const currentCount = currentInstances.length;

    if (targetInstances > currentCount) {
      // Scale up
      const toAdd = targetInstances - currentCount;
      for (let i = 0; i < toAdd; i++) {
        await this.spawnInstance(serviceName, definition);
      }
    } else if (targetInstances < currentCount) {
      // Scale down
      const toRemove = currentCount - targetInstances;
      const instancesToRemove = currentInstances.slice(0, toRemove);

      for (const instance of instancesToRemove) {
        await this.deregisterInstance(serviceName, instance.id);
      }
    }

    console.log(`[MicroserviceArchitecture] Scaled ${serviceName} to ${targetInstances} instances`);
  }

  async getServiceMetrics(serviceName: string): Promise<{
    totalInstances: number;
    healthyInstances: number;
    totalRequests: number;
    totalErrors: number;
    averageResponseTime: number;
    requestsPerSecond: number;
    cpuUsage: number;
    memoryUsage: number;
  }> {
    const instances = this.registry.services.get(serviceName) || [];

    const metrics = {
      totalInstances: instances.length,
      healthyInstances: instances.filter(i => i.health.status === 'healthy').length,
      totalRequests: instances.reduce((sum, i) => sum + i.metrics.requestCount, 0),
      totalErrors: instances.reduce((sum, i) => sum + i.metrics.errorCount, 0),
      averageResponseTime: instances.length > 0
        ? instances.reduce((sum, i) => sum + i.metrics.averageResponseTime, 0) / instances.length
        : 0,
      requestsPerSecond: 0,
      cpuUsage: instances.length > 0
        ? instances.reduce((sum, i) => sum + i.metrics.cpuUsage, 0) / instances.length
        : 0,
      memoryUsage: instances.length > 0
        ? instances.reduce((sum, i) => sum + i.metrics.memoryUsage, 0) / instances.length
        : 0
    };

    return metrics;
  }

  configureLoadBalancer(strategy: LoadBalancerStrategy): void {
    this.loadBalancer = strategy;
    console.log(`[MicroserviceArchitecture] Load balancer configured: ${strategy.type}`);
  }

  configureCircuitBreaker(config: CircuitBreakerConfig): void {
    this.circuitBreaker = config;
    console.log(`[MicroserviceArchitecture] Circuit breaker configured`);
  }

  configureServiceDiscovery(config: ServiceDiscoveryConfig): void {
    this.serviceDiscovery = config;
    console.log(`[MicroserviceArchitecture] Service discovery configured: ${config.strategy}`);
  }

  async exportArchitectureDiagram(): Promise<string> {
    const services = Array.from(this.registry.serviceDefinitions.entries());
    const instances = Array.from(this.registry.services.entries());

    let diagram = 'graph TB\n';

    // Add service definitions
    services.forEach(([name, def]) => {
      diagram += `  ${name}["Service: ${name}<br/>Version: ${def.version}<br/>Port: ${def.port}"]\n`;
    });

    // Add dependencies
    services.forEach(([name, def]) => {
      def.dependencies.forEach(dep => {
        if (this.registry.serviceDefinitions.has(dep)) {
          diagram += `  ${name} --> ${dep}\n`;
        }
      });
    });

    // Add instances
    instances.forEach(([serviceName, serviceInstances]) => {
      serviceInstances.forEach(instance => {
        const color = instance.health.status === 'healthy' ? '#90EE90' : '#FFB6C6';
        diagram += `  ${instance.id}["Instance: ${instance.id}<br/>Status: ${instance.status}<br/>Health: ${instance.health.status}"]:::${instance.health.status}\n`;
        diagram += `  ${serviceName} --> ${instance.id}\n`;
      });
    });

    // Add styles
    diagram += `\n  classDef healthy fill:#90EE90,stroke:#006400,color:#000\n`;
    diagram += `  classDef unhealthy fill:#FFB6C6,stroke:#8B0000,color:#000\n`;
    diagram += `  classDef unknown fill:#D3D3D3,stroke:#555,color:#000\n`;

    return diagram;
  }

  getRegisteredServices(): Array<{
    name: string;
    version: string;
    instanceCount: number;
    healthyCount: number;
    port: number;
    protocol: string;
  }> {
    return Array.from(this.registry.serviceDefinitions.entries()).map(([name, def]) => {
      const instances = this.registry.services.get(name) || [];
      const healthyCount = instances.filter(i => i.health.status === 'healthy').length;

      return {
        name,
        version: def.version,
        instanceCount: instances.length,
        healthyCount,
        port: def.port,
        protocol: def.protocol
      };
    });
  }

  private async startHealthCheck(instance: ServiceInstance): Promise<void> {
    const definition = this.registry.serviceDefinitions.get(instance.serviceName);
    if (!definition) return;

    const healthCheckKey = `${instance.serviceName}:${instance.id}`;

    const check = setInterval(async () => {
      await this.performHealthCheck(instance, definition);
    }, definition.healthCheck.interval);

    this.registry.healthChecks.set(healthCheckKey, check);

    // Initial health check
    await this.performHealthCheck(instance, definition);
  }

  private async performHealthCheck(instance: ServiceInstance, definition: ServiceDefinition): Promise<void> {
    const startTime = Date.now();
    instance.lastHealthCheck = startTime;

    try {
      const healthUrl = `http://${instance.host}:${instance.port}${definition.healthCheck.path}`;
      const response = await fetch(healthUrl);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        instance.health = {
          status: 'healthy',
          lastCheck: Date.now(),
          responseTime
        };
        instance.status = 'healthy';
      } else {
        instance.health = {
          status: 'unhealthy',
          lastCheck: Date.now(),
          responseTime,
          error: `Health check failed with status: ${response.status}`
        };
        instance.status = 'unhealthy';
      }
    } catch (error) {
      instance.health = {
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      instance.status = 'unhealthy';
    }

    // Update metrics (simulated)
    instance.metrics.cpuUsage = Math.random() * 100;
    instance.metrics.memoryUsage = Math.random() * 100;
  }

  private async spawnInstance(serviceName: string, definition: ServiceDefinition): Promise<void> {
    const instanceId = await this.registerInstance({
      serviceName,
      version: definition.version,
      status: 'starting',
      host: definition.host || 'localhost',
      port: definition.port,
      health: {
        status: 'unknown',
        lastCheck: Date.now()
      },
      metrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        requestCount: 0,
        errorCount: 0,
        averageResponseTime: 0
      },
      registeredAt: Date.now(),
      lastHealthCheck: Date.now()
    });

    // Simulate instance startup
    setTimeout(() => {
      const instances = this.registry.services.get(serviceName);
      const instance = instances?.find(i => i.id === instanceId);
      if (instance) {
        instance.status = 'healthy';
      }
    }, 2000);
  }

  private selectInstance(instances: ServiceInstance[]): ServiceInstance {
    switch (this.loadBalancer.type) {
      case 'round-robin':
        return this.roundRobinSelect(instances);

      case 'random':
        return instances[Math.floor(Math.random() * instances.length)];

      case 'least-connections':
        return instances.reduce((least, current) =>
          current.metrics.requestCount < least.metrics.requestCount ? current : least
        );

      case 'weighted':
        // Simple weighted random selection based on health
        const healthy = instances.filter(i => i.health.status === 'healthy');
        return healthy[Math.floor(Math.random() * healthy.length)];

      case 'latency-based':
        return instances.reduce((fastest, current) =>
          (current.metrics.averageResponseTime || Infinity) < (fastest.metrics.averageResponseTime || Infinity)
            ? current : fastest
        );

      default:
        return instances[0];
    }
  }

  private roundRobinSelect(instances: ServiceInstance[]): ServiceInstance {
    const current = this.roundRobinCounters.get(instances[0].serviceName) || 0;
    const selected = instances[current % instances.length];
    this.roundRobinCounters.set(instances[0].serviceName, current + 1);
    return selected;
  }

  async shutdown(): Promise<void> {
    // Clear all health checks
    this.registry.healthChecks.forEach(check => clearInterval(check));
    this.registry.healthChecks.clear();

    console.log('[MicroserviceArchitecture] Service shutdown complete');
  }
}

// Export singleton instance
export const microserviceArchitectureService = new MicroserviceArchitectureService();
