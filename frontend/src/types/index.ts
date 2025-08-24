export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'employee' | 'observer';
  institutionId?: string;
  institutionName?: string;
}

export interface Institution {
  id: string;
  name: string;
  supervisorId: string;
  supervisorName: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  createdBy: string;
  status: 'active' | 'completed' | 'paused';
  tasks: Task[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  institutionId: string;
  institutionName: string;
  status: 'initial' | 'in_progress' | 'completed';
  progress: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  evidence: Evidence[];
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface Evidence {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'document' | 'link';
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  chatType: 'group' | 'private';
  recipientId?: string; // For private messages
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTask: number;
  institutionsCount: number;
  activeUsers: number;
}
