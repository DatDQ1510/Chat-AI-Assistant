import projectService from "../services/project.service";
import { Request, Response, NextFunction } from "express";
export const createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { project_name } = req.body;
        const user_id = req.user!.id;
        const project = await projectService.createProject(user_id, project_name);
        return res.status(201).json(project);
    } catch (error) {
        next(error);
    }
};

export const getProjectsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = req.user!.id;
        const { limit, offset } = req.query;
        const projects = await projectService.getProjectsByUserId(user_id, Number(limit), Number(offset));
        return res.status(200).json(projects);
    } catch (error) {
        next(error);
    }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = req.user!.id;
        const { project_id } = req.params;
        await projectService.deleteProject(user_id, project_id);
        return res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = req.user!.id;   
        const { project_id } = req.params;
        const { project_name } = req.body;
        const updatedProject = await projectService.updateProject(user_id, project_id, project_name);
        return res.status(200).json(updatedProject);
    } catch (error) {
        next(error);
    }  
};
