import { Project } from "../models/project.model";

class ProjectRepository {
    async createProject(user_id: string, project_name: string, description?: string | null): Promise<Project> {
        const project = await Project.create({
            user_id,
            project_name,
            description
        });
        return project;
    }

    async getProjectsByUserId(user_id: string): Promise<Project[]> {
        return Project.findAll({
            where: { user_id },
            order: [["updatedAt", "DESC"]],
            attributes: ["project_name", "id", "createdAt", "updatedAt", "user_id"],
        });
    }

    async deleteProject(user_id: string, project_id: string): Promise<void> {
        await Project.destroy(
            { where: { id: project_id, user_id } }
        );
    }

    async updateProject(user_id: string, project_id: string, project_name: string): Promise<Project | null> {
        await Project.update(
            { project_name },
            { where: { id: project_id, user_id } }
        );
        return Project.findOne({ where: { id: project_id, user_id } });
    }
}

export default new ProjectRepository();
