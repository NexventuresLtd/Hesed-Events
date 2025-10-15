import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { TaskCommentsModal } from "./TaskCommentsModal";
import {
  ChevronDown,
  ChevronRight,
  MessageSquare,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

interface TaskOverview {
  id: number;
  title: string;
  description: string;
  project: number;
  project_title: string;
  assignee_name: string;
  status: "initial" | "in_progress" | "completed";
  progress: number;
  due_date: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
  comments?: any[];
  comment_count?: number;
}

interface ProjectGroup {
  id: number;
  title: string;
  description: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  initial_tasks: number;
  completion_percentage: number;
  tasks: TaskOverview[];
}

const statusConfig = {
  initial: {
    label: "Not Started",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    icon: BarChart3,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    icon: CheckCircle,
  },
};

export function OverviewNew() {
  const [projects, setProjects] = useState<ProjectGroup[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskOverview | null>(null);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch projects
      const projectsResponse: any = await apiService.getProjects();
      const tasksResponse: any = await apiService.getTasks();

      // Group tasks by project
      const projectsWithTasks = projectsResponse?.results?.map((project: any) => {
        const projectTasks = tasksResponse.results.filter(
          (task: TaskOverview) => task.project === project.id
        );

        return {
          id: project.id,
          title: project.title,
          description: project.description,
          status: project.status,
          total_tasks: projectTasks.length,
          completed_tasks: projectTasks.filter(
            (t: TaskOverview) => t.status === "completed"
          ).length,
          in_progress_tasks: projectTasks.filter(
            (t: TaskOverview) => t.status === "in_progress"
          ).length,
          initial_tasks: projectTasks.filter(
            (t: TaskOverview) => t.status === "initial"
          ).length,
          completion_percentage:
            projectTasks.length > 0
              ? Math.round(
                  (projectTasks.filter(
                    (t: TaskOverview) => t.status === "completed"
                  ).length /
                    projectTasks.length) *
                    100
                )
              : 0,
          tasks: projectTasks,
        };
      });

      setProjects(projectsWithTasks);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load projects and tasks");
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">Project Overview</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">Project Overview</h1>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalTasks = projects.reduce((sum, p) => sum + p.total_tasks, 0);
  const completedTasks = projects.reduce(
    (sum, p) => sum + p.completed_tasks,
    0
  );
  const inProgressTasks = projects.reduce(
    (sum, p) => sum + p.in_progress_tasks,
    0
  );
  const overdueTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.is_overdue).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Project Overview</h1>
          <p className="text-muted">
            View projects and their tasks in a hierarchical structure
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Tasks</p>
              <p className="text-2xl font-bold text-text">{totalTasks}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {completedTasks}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {inProgressTasks}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-muted/20 p-12 text-center">
            <p className="text-muted">No projects found</p>
          </div>
        ) : (
          projects.map((project) => {
            const isExpanded = expandedProjects.has(project.id);

            return (
              <div
                key={project.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-muted/20 overflow-hidden"
              >
                {/* Project Header */}
                <button
                  onClick={() => toggleProject(project.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/5 transition-colors text-left"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="text-primary">
                      {isExpanded ? (
                        <ChevronDown size={24} />
                      ) : (
                        <ChevronRight size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text">
                        {project.title}
                      </h3>
                      <p className="text-sm text-muted">
                        {project.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {project.completion_percentage}%
                      </div>
                      <div className="text-xs text-muted">Complete</div>
                    </div>
                    <div className="hidden sm:flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-text">
                          {project.total_tasks}
                        </div>
                        <div className="text-xs text-muted">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-600">
                          {project.completed_tasks}
                        </div>
                        <div className="text-xs text-muted">Done</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-blue-600">
                          {project.in_progress_tasks}
                        </div>
                        <div className="text-xs text-muted">Progress</div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Tasks List (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-muted/20">
                    {project.tasks.length === 0 ? (
                      <div className="px-6 py-8 text-center text-muted">
                        No tasks in this project
                      </div>
                    ) : (
                      <div className="divide-y divide-muted/10">
                        {project.tasks.map((task) => {
                          const statusInfo = statusConfig[task.status];
                          const StatusIcon = statusInfo.icon;

                          return (
                            <div
                              key={task.id}
                              className="px-6 py-4 hover:bg-muted/5 transition-colors"
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h4 className="font-medium text-text">
                                      {task.title}
                                    </h4>
                                    <button
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setCommentsModalOpen(true);
                                      }}
                                      className="flex items-center space-x-1 text-xs text-muted hover:text-primary transition-colors"
                                    >
                                      <MessageSquare size={14} />
                                      <span>{task.comments?.length || 0}</span>
                                    </button>
                                  </div>
                                  {task.description && (
                                    <p className="text-sm text-muted mb-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center space-x-2">
                                      <User size={14} className="text-muted" />
                                      <span className="text-text">
                                        {task.assignee_name}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Calendar
                                        size={14}
                                        className="text-muted"
                                      />
                                      <span
                                        className={
                                          task.is_overdue
                                            ? "text-red-600 font-medium"
                                            : "text-text"
                                        }
                                      >
                                        {formatDate(task.due_date)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <span
                                    className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                                  >
                                    <StatusIcon size={12} />
                                    <span>{statusInfo.label}</span>
                                  </span>
                                  <div className="min-w-[100px]">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-muted">
                                        Progress
                                      </span>
                                      <span className="text-xs font-medium text-text">
                                        {task.progress}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all ${getProgressColor(
                                          task.progress
                                        )}`}
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Comments Modal */}
      {selectedTask && (
        <TaskCommentsModal
          taskId={selectedTask.id}
          taskTitle={selectedTask.title}
          isOpen={commentsModalOpen}
          onClose={() => {
            setCommentsModalOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
