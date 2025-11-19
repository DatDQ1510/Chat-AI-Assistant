import axios from 'axios';
import type { Project, Conversation } from '../types/chat';

// In production (Docker), VITE_API_URL="" (empty string) for relative paths
// In development, VITE_API_URL=undefined, fallback to localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:5000';

interface ProjectDto {
  id: string;
  project_name: string;
  description?: string;
  user_id: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationDto {
  id: string;
  conversation_name: string;
  user_id: string;
  project_id?: string;
  createdAt: string;
  updatedAt: string;
}

const mapProject = (dto: ProjectDto): Project => ({
  id: dto.id,
  project_name: dto.project_name,
  description: dto.description,
  user_id: dto.user_id,
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});

const mapConversation = (dto: ConversationDto): Conversation => ({
  id: dto.id,
  title: dto.conversation_name,
  user_id: dto.user_id,
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});

class ProjectService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get all projects for current user
   */
  async getProjects(): Promise<Project[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/api/projects`, {
        headers: this.getAuthHeaders(),
      });

      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data.map(mapProject);
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  }

  /**
   * Create new project
   */
  async createProject(projectName: string, description?: string): Promise<Project> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/v1/api/projects`,
        { project_name: projectName, description },
        { headers: this.getAuthHeaders() }
      );

      return mapProject(response.data.data);
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/v1/api/projects/${projectId}`, {
        headers: this.getAuthHeaders(),
      });

    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  /**
   * Update project name
   */
  async updateProject(projectId: string, projectName: string, description?: string): Promise<void> {
    try {
      await axios.patch(
        `${API_BASE_URL}/v1/api/projects/${projectId}`,
        { project_name: projectName, description },
        { headers: this.getAuthHeaders() }
      );

    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }

  /**
   * Get conversations by project ID
   */
  async getConversationsByProjectId(projectId: string): Promise<Conversation[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/v1/api/projects/${projectId}/conversations`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data.map(mapConversation);
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch conversations for project:', error);
      throw error;
    }
  }

  /**
   * Get single project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/v1/api/projects/${projectId}`,
        { headers: this.getAuthHeaders() }
      );

      return mapProject(response.data.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
      throw error;
    }
  }
}

export default new ProjectService();
