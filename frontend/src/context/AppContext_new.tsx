import React, { createContext, useContext, useReducer, useEffect } from "react";
import { apiService } from "../services/api";
import type {
  User,
  Project,
  Task,
  Institution,
  ChatMessage,
  DashboardStats,
} from "../types";

interface AppState {
  user: User | null;
  projects: Project[];
  institutions: Institution[];
  tasks: Task[];
  groupMessages: ChatMessage[];
  privateMessages: ChatMessage[];
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_PROJECTS"; payload: Project[] }
  | { type: "SET_INSTITUTIONS"; payload: Institution[] }
  | { type: "SET_TASKS"; payload: Task[] }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "ADD_COMMENT"; payload: { taskId: string; comment: any } }
  | { type: "ADD_EVIDENCE"; payload: { taskId: string; evidence: any } }
  | { type: "ADD_GROUP_MESSAGE"; payload: ChatMessage }
  | { type: "ADD_PRIVATE_MESSAGE"; payload: ChatMessage }
  | { type: "SET_STATS"; payload: DashboardStats }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

const initialState: AppState = {
  user: null,
  projects: [],
  institutions: [],
  tasks: [],
  groupMessages: [],
  privateMessages: [],
  stats: {
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTask: 0,
    institutionsCount: 0,
    activeUsers: 0,
  },
  isLoading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_PROJECTS":
      return { ...state, projects: action.payload };
    case "SET_INSTITUTIONS":
      return { ...state, institutions: action.payload };
    case "SET_TASKS":
      return { ...state, tasks: action.payload };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case "ADD_COMMENT":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? {
                ...task,
                comments: [...task.comments, action.payload.comment],
              }
            : task
        ),
      };
    case "ADD_EVIDENCE":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? {
                ...task,
                evidence: [...task.evidence, action.payload.evidence],
              }
            : task
        ),
      };
    case "ADD_GROUP_MESSAGE":
      return {
        ...state,
        groupMessages: [...state.groupMessages, action.payload],
      };
    case "ADD_PRIVATE_MESSAGE":
      return {
        ...state,
        privateMessages: [...state.privateMessages, action.payload],
      };
    case "SET_STATS":
      return { ...state, stats: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loadInitialData: () => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load user from localStorage on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        dispatch({ type: "SET_USER", payload: user });
        loadInitialData();
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Load initial data from API
  const loadInitialData = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      
      // Load all data in parallel
      const [projects, institutions, tasks] = await Promise.all([
        apiService.getProjects().catch(() => []),
        apiService.getInstitutions().catch(() => []),
        apiService.getTasks().catch(() => [])
      ]);

      // Convert backend data to frontend format
      const convertedProjects: Project[] = projects.map(project => ({
        id: project.id.toString(),
        title: project.name,
        description: project.description,
        createdAt: project.start_date,
        createdBy: `${project.created_by.first_name} ${project.created_by.last_name}`.trim() || project.created_by.username,
        status: project.status === 'planning' ? 'paused' : project.status as 'active' | 'completed' | 'paused',
        tasks: []
      }));

      const convertedInstitutions: Institution[] = institutions.map(inst => ({
        id: inst.id.toString(),
        name: inst.name,
        supervisorId: "1",
        supervisorName: "Admin"
      }));

      const convertedTasks: Task[] = tasks.map(task => ({
        id: task.id.toString(),
        projectId: task.project.id.toString(),
        title: task.title,
        description: task.description,
        assigneeId: task.assigned_to.id.toString(),
        assigneeName: `${task.assigned_to.first_name} ${task.assigned_to.last_name}`.trim() || task.assigned_to.username,
        institutionId: task.project.institution.id.toString(),
        institutionName: task.project.institution.name,
        status: task.status === 'done' ? 'completed' : task.status === 'in_progress' ? 'in_progress' : 'initial',
        progress: task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0,
        dueDate: task.due_date,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        comments: [],
        evidence: []
      }));

      // Add tasks to projects
      convertedProjects.forEach(project => {
        project.tasks = convertedTasks.filter(task => task.projectId === project.id);
      });

      dispatch({ type: "SET_PROJECTS", payload: convertedProjects });
      dispatch({ type: "SET_INSTITUTIONS", payload: convertedInstitutions });
      dispatch({ type: "SET_TASKS", payload: convertedTasks });

      // Calculate stats
      const stats: DashboardStats = {
        totalProjects: convertedProjects.length,
        totalTasks: convertedTasks.length,
        completedTasks: convertedTasks.filter(t => t.status === 'completed').length,
        inProgressTasks: convertedTasks.filter(t => t.status === 'in_progress').length,
        overdueTask: 0,
        institutionsCount: convertedInstitutions.length,
        activeUsers: 1
      };

      dispatch({ type: "SET_STATS", payload: stats });
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      dispatch({ type: "SET_ERROR", payload: "Failed to load data" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, loadInitialData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
