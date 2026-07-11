import { projectRepository } from '../repositories/project.repository';

export class ProjectService {
  async getAllProjects(organizationId: string) {
    return projectRepository.findMany(organizationId);
  }

  async createProject(name: string, description: string | undefined, organizationId: string) {
    const existing = await projectRepository.findByName(name, organizationId);
    if (existing) {
      throw new Error(`A project named "${name}" already exists in your organization.`);
    }

    return projectRepository.create({
      name,
      description,
      organizationId
    });
  }

  async getProjectById(id: string, organizationId: string) {
    const project = await projectRepository.findById(id, organizationId);
    if (!project) {
      throw new Error('Project not found or access denied.');
    }
    return project;
  }

  async updateProject(id: string, organizationId: string, data: { name?: string; description?: string }) {
    await this.getProjectById(id, organizationId);

    if (data.name) {
      const existing = await projectRepository.findByName(data.name, organizationId);
      if (existing && existing.id !== id) {
        throw new Error(`A project named "${data.name}" already exists in your organization.`);
      }
    }

    await projectRepository.update(id, organizationId, data);
    return this.getProjectById(id, organizationId);
  }

  async deleteProject(id: string, organizationId: string) {
    await this.getProjectById(id, organizationId);
    return projectRepository.delete(id, organizationId);
  }
}
export const projectService = new ProjectService();
