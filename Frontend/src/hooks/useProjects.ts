import { useState, useCallback } from 'react';
import { message as antMessage } from 'antd';
import projectService from '../services/project.service';
import type { Project, Conversation } from '../types/chat';

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  expandedProjects: Set<string>;
  loadingConversations: Set<string>;
  fetchProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, name: string, description?: string) => Promise<void>;
  toggleProject: (projectId: string) => Promise<void>;
  fetchProjectConversations: (projectId: string) => Promise<Conversation[]>;
  refreshAllExpandedProjects: () => Promise<void>; // ✅ New method to refresh all
}

export const useProjects = (): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [loadingConversations, setLoadingConversations] = useState<Set<string>>(new Set());

  /**
   * Fetch all projects
   */
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedProjects = await projectService.getProjects();
      setProjects(fetchedProjects);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      antMessage.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new project
   */
  const createProject = useCallback(async (name: string, description?: string) => {
    try {
      const newProject = await projectService.createProject(name, description);
      setProjects((prev) => [newProject, ...prev]);
      antMessage.success(`Project "${name}" created successfully`);
    } catch (error) {

      antMessage.error('Failed to create project');
      throw error;
    }
  }, []);

  /**
   * Delete project
   */
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setExpandedProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
      antMessage.success('Project deleted successfully');
    } catch (error) {

      antMessage.error('Failed to delete project');
      throw error;
    }
  }, []);

  /**
   * Update project
   */
  const updateProject = useCallback(async (projectId: string, name: string, description?: string) => {
    try {
      await projectService.updateProject(projectId, name, description);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, project_name: name, description } : p))
      );
      antMessage.success('Project updated successfully');
    } catch (error) {

      antMessage.error('Failed to update project');
      throw error;
    }
  }, []);

  /**
   * Fetch conversations for a project
   */
  const fetchProjectConversations = useCallback(async (projectId: string): Promise<Conversation[]> => {
    setLoadingConversations((prev) => new Set(prev).add(projectId));
    try {
      const conversations = await projectService.getConversationsByProjectId(projectId);
      
      // ✅ IMPORTANT: Ensure each conversation has project_id set correctly
      const conversationsWithProjectId = conversations.map(conv => ({
        ...conv,
        project_id: projectId, // Explicitly set project_id for drag & drop validation
      }));
      
      // Update project with conversations
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, conversations: conversationsWithProjectId } : p))
      );
      
      return conversationsWithProjectId;
    } catch (error) {
      console.error('Failed to fetch conversations for project:', error);
      antMessage.error('Failed to load conversations');
      return [];
    } finally {
      setLoadingConversations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  }, []);

  /**
   * Toggle project expansion
   */
  const toggleProject = useCallback(async (projectId: string) => {
    const isExpanded = expandedProjects.has(projectId);

    if (isExpanded) {
      // Collapse
      setExpandedProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    } else {
      // Expand and fetch conversations
      setExpandedProjects((prev) => new Set(prev).add(projectId));
      
      const project = projects.find((p) => p.id === projectId);
      if (!project?.conversations || project.conversations.length === 0) {
        await fetchProjectConversations(projectId);
      }
    }
  }, [expandedProjects, projects, fetchProjectConversations]);

  /**
   * Refresh all expanded projects - Call API to get latest data
   */
  const refreshAllExpandedProjects = useCallback(async () => {

    
    // Refresh each expanded project
    const refreshPromises = Array.from(expandedProjects).map(projectId => 
      fetchProjectConversations(projectId)
    );
    
    await Promise.all(refreshPromises);

  }, [expandedProjects, fetchProjectConversations]);

  return {
    projects,
    loading,
    expandedProjects,
    loadingConversations,
    fetchProjects,
    createProject,
    deleteProject,
    updateProject,
    toggleProject,
    fetchProjectConversations,
    refreshAllExpandedProjects, // ✅ Export new method
  };
};
