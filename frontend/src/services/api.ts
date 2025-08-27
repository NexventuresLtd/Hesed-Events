const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface LoginCredentials {
  username: string;
  password: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'employee' | 'observer';
  institution: number | null;
  institution_name: string | null;
  phone: string;
  is_active: boolean;
  date_joined: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface Institution {
  id: number;
  name: string;
  type: string;
  location: string;
  created_at: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  institution: Institution;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  created_by: User;
  assigned_users: User[];
}

interface Task {
  id: number;
  title: string;
  description: string;
  project: Project;
  assigned_to: User;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: number;
  sender: number;
  sender_name: string;
  sender_role: string;
  recipient: number | null;
  content: string;
  chat_type: 'group' | 'private';
  timestamp: string;
  is_read: boolean;
}

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      let errorObj;

      try {
        errorObj = JSON.parse(text);
      } catch (e) {
        errorObj = null;
      }

      if (errorObj && errorObj.detail) {
        throw new Error(errorObj.detail);
      }

      throw new Error(`API Error: ${response.status} - ${text}`);
    }

    if (response.status === 204) {
      // No Content
      return {} as T;
    }
    return response.json();
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<{ access: string; refresh: string; user: User }> {
    return this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async refreshToken(): Promise<{ access: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    return this.request('/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/auth/user/');
  }

  async getDashboardStats(): Promise<any> {
    return this.request('/auth/dashboard-stats/');
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request('/projects/');
  }

  async getProject(id: number): Promise<Project> {
    return this.request(`/projects/${id}/`);
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    return this.request('/projects/', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project> {
    return this.request(`/projects/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(id: number): Promise<void> {
    return this.request(`/projects/${id}/`, {
      method: 'DELETE',
    });
  }

  // Tasks
  async getTasks(projectId?: number): Promise<Task[]> {
    const endpoint = projectId ? `/tasks/?project=${projectId}` : '/tasks/';
    return this.request(endpoint);
  }

  async getTask(id: number): Promise<Task> {
    return this.request(`/tasks/${id}/`);
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    return this.request('/tasks/', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: number, task: Partial<Task>): Promise<Task> {
    return this.request(`/tasks/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(task),
    });
  }

  async deleteTask(id: number): Promise<void> {
    return this.request(`/tasks/${id}/`, {
      method: 'DELETE',
    });
  }

  // Institutions
  async getInstitutions(): Promise<Institution[]> {
    return this.request('/institutions/');
  }

  async getInstitution(id: number): Promise<Institution> {
    return this.request(`/institutions/${id}/`);
  }

  async createInstitution(institution: Partial<Institution>): Promise<Institution> {
    return this.request('/institutions/', {
      method: 'POST',
      body: JSON.stringify(institution),
    });
  }

  async updateInstitution(id: number, institution: Partial<Institution>): Promise<Institution> {
    return this.request(`/institutions/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(institution),
    });
  }

  async deleteInstitution(id: number): Promise<void> {
    return this.request(`/institutions/${id}/`, {
      method: 'DELETE',
    });
  }

  // Chat
  async getChatMessages(chatType?: 'group' | 'private', recipientId?: number): Promise<PaginatedResponse<ChatMessage>> {
    let endpoint = '/chat/messages/';
    const params = new URLSearchParams();

    if (chatType) params.append('chat_type', chatType);
    if (recipientId) params.append('recipient', recipientId.toString());

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return this.request(endpoint);
  }

  async sendChatMessage(message: {
    content: string;
    chat_type: 'group' | 'private';
    recipient?: number;
  }): Promise<ChatMessage> {
    return this.request('/chat/messages/', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  // Users
  async getUsers(): Promise<PaginatedResponse<User>> {
    return this.request('/users/');
  }

  async getUser(id: number): Promise<User> {
    return this.request(`/users/${id}/`);
  }

  async createUser(user: Partial<User> & { password: string }): Promise<User> {
    return this.request('/users/', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    return this.request(`/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: number): Promise<void> {
    return this.request(`/users/${id}/`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export type { User, Institution, Project, Task, ChatMessage, LoginCredentials };
