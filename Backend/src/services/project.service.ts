import projectRepository from "../repositories/project.repository";

class ProjectService {
    async createProject(user_id: string, project_name: string) {
        return projectRepository.createProject(user_id, project_name);
    }

    async getProjectsByUserId(user_id: string, limit: number, offset: number) {
        return projectRepository.getProjectsByUserId(user_id, limit, offset);
    }

    async deleteProject(user_id: string, project_id: string) {

        return projectRepository.deleteProject(user_id, project_id);
    }

    async updateProject(user_id: string, project_id: string, project_name: string) {
        return projectRepository.updateProject(user_id, project_id, project_name);
    }
}

export default new ProjectService();
