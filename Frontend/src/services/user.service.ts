import apiClient from '../config/axiosClient';

export interface UserSettings {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  language: string;
  writing_style: string;
  custom_instructions?: string;
  roleplay_mode?: string;
}

export interface UpdateSettingsDto {
  language?: string;
  writing_style?: string;
  custom_instructions?: string;
  roleplay_mode?: string;
}

export const userService = {
  // Get current user settings
  getSettings: async (): Promise<UserSettings> => {
    const response = await apiClient.get('v1/api/users/settings');
    console.log('User settings fetched:', response.data);
    return response.data;
  },

  // Update user settings
  updateSettings: async (settings: UpdateSettingsDto): Promise<{ message: string; settings: Partial<UserSettings> }> => {
    const response = await apiClient.patch('v1/api/users/settings', settings);
    return response.data;
  },
};
