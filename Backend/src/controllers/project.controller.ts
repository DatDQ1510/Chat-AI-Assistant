import { Conversation } from "../models/conversation.model";
import conversationService from "../services/conversation.service";
import projectService from "../services/project.service";
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/apiResponse";
export const createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { project_name } = req.body;
        const user_id = req.user!.id;
        const project = await projectService.createProject(user_id, project_name);
        return res.status(201).json(successResponse(project, "Project created successfully"));
    } catch (error) {
        next(error);
    }
};

export const getProjectsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = req.user!.id;
        const projects = await projectService.getProjectsByUserId(user_id);
        return res.status(200).json(successResponse(projects, "Projects fetched successfully"));
    } catch (error) {
        next(error);
    }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = req.user!.id;
        const { project_id } = req.params;
        await projectService.deleteProject(user_id, project_id);
        return res.status(200).json(successResponse(null, "Project deleted successfully"));
    } catch (error) {
        next(error);
    }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = req.user!.id;   
        const { project_id } = req.params;
        const { project_name, description } = req.body;
        const updatedProject = await projectService.updateProject(user_id, project_id, project_name);
        return res.status(200).json(successResponse(updatedProject, "Project updated successfully"));
    } catch (error) {
        next(error);
    }  
};

export const getConversationByProjectId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { project_id } = req.params;
        const conversations = await conversationService.getConversationByProjectId(project_id);
        console.log("Conversations by project id:", conversations);
        return res.status(200).json(successResponse(conversations, "Conversations fetched successfully"));
    } catch (error) {
        next(error);
    }
};

export const updateConversationProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { conversation_id } = req.params;
        const { project_id } = req.body;
        const updatedConversation = await conversationService.updateConversationProject(conversation_id, project_id);
        return res.status(200).json(successResponse(updatedConversation, "Conversation updated successfully"));
    } catch (error) {
        next(error);
    }
};

export const getByProjectId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { project_id } = req.params;
        const base_project = await projectService.getProjectById(project_id);
        if (!base_project) {
            res.status(404).json({ message: "Project not found" });
            return;
        } else {
            return res.status(200).json(successResponse(base_project, "Project fetched successfully"));
        }
    } catch (error) {
        next(error);
    }
};