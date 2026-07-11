import { workerRepository } from '../repositories/worker.repository';
import { WorkerEngine } from '../workers/worker-engine';
import { generateUuid } from '../utils';

export class WorkerService {
  // Dictionary holding the active in-memory worker engines
  private activeEngines: Map<string, WorkerEngine> = new Map();

  async getWorkers() {
    return workerRepository.findMany();
  }

  async getWorkerById(id: string) {
    const worker = await workerRepository.findById(id);
    if (!worker) {
      throw new Error('Worker node not found.');
    }
    return worker;
  }

  async registerWorker(name: string) {
    const existing = await workerRepository.findByName(name);
    if (existing) {
      throw new Error(`A worker node named "${name}" is already registered.`);
    }

    const id = generateUuid();
    return workerRepository.upsert({
      id,
      name,
      status: 'offline',
      cpuUsage: 0,
      memoryUsage: 0,
      lastHeartbeat: new Date()
    });
  }

  async startWorker(id: string) {
    const worker = await this.getWorkerById(id);
    if (this.activeEngines.has(id)) {
      throw new Error(`Worker daemon "${worker.name}" is already running.`);
    }

    const engine = new WorkerEngine(id, worker.name);
    this.activeEngines.set(id, engine);
    await engine.start();

    return this.getWorkerById(id);
  }

  async stopWorker(id: string) {
    const worker = await this.getWorkerById(id);
    const engine = this.activeEngines.get(id);

    if (!engine) {
      // If engine is not in memory (e.g. server restarted), update DB state directly
      await workerRepository.upsert({
        id: worker.id,
        name: worker.name,
        status: 'offline',
        cpuUsage: 0,
        memoryUsage: 0,
        lastHeartbeat: new Date()
      });
      return this.getWorkerById(id);
    }

    await engine.stop();
    this.activeEngines.delete(id);

    return this.getWorkerById(id);
  }

  async deleteWorker(id: string) {
    // Stop engine if running
    if (this.activeEngines.has(id)) {
      await this.stopWorker(id);
    }
    return workerRepository.delete(id);
  }

  async getHealthStats() {
    const workers = await workerRepository.findMany();
    const online = workers.filter(w => w.status === 'online' || w.status === 'busy').length;
    const offline = workers.filter(w => w.status === 'offline').length;

    return {
      total: workers.length,
      online,
      offline
    };
  }

  // Gracefully stop all active engines on server shutdown
  async shutdownAll() {
    console.log('[Worker Service] Initiating shutdown for all active engine pools...');
    const stopPromises = Array.from(this.activeEngines.keys()).map(id => this.stopWorker(id));
    await Promise.all(stopPromises);
    console.log('[Worker Service] All worker pools shut down successfully.');
  }
}
export const workerService = new WorkerService();
export default workerService;
