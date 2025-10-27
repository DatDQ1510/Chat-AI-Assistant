import { Project } from "../models/project.model";

class ProjectRepository {
    async createProject(user_id: string, project_name: string): Promise<Project> {
        const project = await Project.create({
            user_id,
            project_name
        });
        return project;
    }

    async getProjectsByUserId(user_id: string, limit: number, offset: number): Promise<{ rows: Project[]; count: number }> {
        return Project.findAndCountAll({
            where: { user_id },
            order: [["updatedAt", "DESC"]],
            limit,
            offset,
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
