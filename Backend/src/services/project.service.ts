import projectRepository from "../repositories/project.repository";

class ProjectService {
    async createProject(user_id: string, project_name: string) {
        return projectRepository.createProject(user_id, project_name);
    }

    async getProjectsByUserId(user_id: string) {
        return projectRepository.getProjectsByUserId(user_id);
    }

    async deleteProject(user_id: string, project_id: string) {

        return projectRepository.deleteProject(user_id, project_id);
    }

    async updateProject(user_id: string, project_id: string, project_name: string) {
        return projectRepository.updateProject(user_id, project_id, project_name);
    }

    async getProjectById(project_id: string) {
        return projectRepository.getProjectById(project_id);
    }
}

export default new ProjectService();
