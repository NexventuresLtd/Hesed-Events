import { useState } from "react";
import { useApp } from "../context/AppContext";
import { TaskCard } from "./TaskCard";
import { ProjectModal } from "./ProjectModal";
import { TaskModal } from "./TaskModal";
import { TaskCommentsModal } from "./TaskCommentsModal";
import {
  Plus,
  FolderKanban,
  Filter,
  Search,
  MessageSquare,
  GitBranch,
} from "lucide-react";
import { apiService } from "../services/api";
import type { Task, Project } from "../types";

export function Projects() {
  const { state, loadInitialData } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Task["status"]>(
    "all"
  );
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskModalMode, setTaskModalMode] = useState<"create" | "edit">("edit");
  const [createTaskStatus, setCreateTaskStatus] = useState<
    "initial" | "in_progress" | "completed"
  >("initial");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [commentsTask, setCommentsTask] = useState<Task | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  // Filter tasks based on search term and status
  const filteredTasks = state.tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.institutionName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesProject =
      !selectedProject || task.projectId === selectedProject;

    return matchesSearch && matchesStatus && matchesProject;
  });

  // Group tasks by status for kanban view
  const tasksByStatus = {
    initial: filteredTasks.filter((task) => task.status === "initial"),
    in_progress: filteredTasks.filter((task) => task.status === "in_progress"),
    completed: filteredTasks.filter((task) => task.status === "completed"),
  };

  const canCreateProject = state.user?.role === "admin";

  // Filter to only show main projects (parent_project is null)
  const mainProjects = state.projects.filter((p) => !p.is_sub_activity);

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setTaskModalMode("edit");
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = (
    status: "initial" | "in_progress" | "completed"
  ) => {
    setEditingTask(null);
    setTaskModalMode("create");
    setCreateTaskStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleColumnClick = (
    status: "initial" | "in_progress" | "completed"
  ) => {
    // Only allow task creation if user has permission and a project is selected
    if (
      (state.user?.role === "admin" || state.user?.role === "supervisor") &&
      selectedProject
    ) {
      handleCreateTask(status);
    }
  };

  const handleCommentsClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setCommentsTask(task);
    setIsCommentsModalOpen(true);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (
    e: React.DragEvent,
    newStatus: "initial" | "in_progress" | "completed"
  ) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskId = e.dataTransfer.getData("text/plain");
    const task = state.tasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    // Only allow status changes for admin/supervisor roles
    if (state.user?.role !== "admin" && state.user?.role !== "supervisor") {
      setDraggedTask(null);
      return;
    }

    try {
      // Update progress based on status
      let newProgress = task.progress;
      if (newStatus === "initial") newProgress = 0;
      else if (newStatus === "in_progress" && newProgress === 0)
        newProgress = 50;
      else if (newStatus === "completed") newProgress = 100;

      // Update task via API
      await apiService.updateTask(parseInt(task.id), {
        title: task.title,
        description: task.description,
        status: newStatus,
        progress: newProgress,
        assignee: task.assigneeId ? parseInt(task.assigneeId) : null,
        due_date: task.dueDate || null,
      } as any);

      // Reload data to reflect changes
      await loadInitialData();
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status");
    } finally {
      setDraggedTask(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text dark:text-dark-text">
            Projects
          </h1>
          <p className="text-muted dark:text-dark-muted mt-1">
            Manage and track all project activities
          </p>
        </div>

        {canCreateProject && (
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Plus size={20} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-card rounded-lg border border-muted/20 dark:border-dark-border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted dark:text-dark-muted"
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-muted/30 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-dark-bg text-text dark:text-dark-text"
            />
          </div>

          {/* Project Filter */}
          <select
            value={selectedProject || ""}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="px-3 py-2 border border-muted/30 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-dark-bg text-text dark:text-dark-text"
          >
            <option value="">All Projects</option>
            {state.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="relative">
            <Filter
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted dark:text-dark-muted"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | Task["status"])
              }
              className="w-full pl-10 pr-4 py-2 border border-muted/30 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white dark:bg-dark-bg text-text dark:text-dark-text"
            >
              <option value="all">All Status</option>
              <option value="initial">Initial</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center text-sm text-muted dark:text-dark-muted">
            <FolderKanban size={16} className="mr-2" />
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="bg-white dark:bg-dark-card rounded-lg border border-muted/20 dark:border-dark-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text dark:text-dark-text">
            All Projects
          </h2>
          <span className="text-sm text-muted dark:text-dark-muted">
            {mainProjects.length} project{mainProjects.length !== 1 ? "s" : ""}
          </span>
        </div>

        {mainProjects.length === 0 ? (
          <div className="text-center py-8 text-muted dark:text-dark-muted">
            <FolderKanban size={48} className="mx-auto mb-4 opacity-50" />
            <p>No projects found</p>
            {canCreateProject && (
              <p className="text-sm mt-2 text-primary">
                Click "New Project" to get started
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mainProjects.map((project) => (
              <div key={project.id}>
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedProject === project.id
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-muted/30 dark:border-dark-border hover:border-primary/50"
                  }`}
                  onClick={() =>
                    setSelectedProject(
                      selectedProject === project.id ? null : project.id
                    )
                  }
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-text dark:text-dark-text truncate pr-2">
                      {project.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        project.status === "active"
                          ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                          : project.status === "completed"
                          ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <p
                    className="text-sm text-muted dark:text-dark-muted mb-3 overflow-hidden"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {project.description}
                  </p>

                  <div className="space-y-1 text-xs text-muted dark:text-dark-muted">
                    <div className="flex justify-between">
                      <span>Tasks:</span>
                      <span className="font-medium text-text dark:text-dark-text">
                        {project.tasks?.length || 0}
                      </span>
                    </div>
                    {project.start_date && (
                      <div className="flex justify-between">
                        <span>Start Date:</span>
                        <span className="text-text dark:text-dark-text">
                          {new Date(project.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {project.end_date && (
                      <div className="flex justify-between">
                        <span>End Date:</span>
                        <span className="text-text dark:text-dark-text">
                          {new Date(project.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span className="text-text dark:text-dark-text">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created by:</span>
                      <span className="font-medium text-text dark:text-dark-text">
                        {project.createdBy}
                      </span>
                    </div>
                    {project.sub_activities &&
                      project.sub_activities.length > 0 && (
                        <div className="flex justify-between">
                          <span>Sub-activities:</span>
                          <span className="font-medium text-primary">
                            {project.sub_activities.length}
                          </span>
                        </div>
                      )}
                  </div>

                  {selectedProject === project.id && (
                    <div className="mt-3 pt-3 border-t border-muted/20 dark:border-dark-border">
                      <div className="flex space-x-2">
                        {state.user?.role === "admin" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProject(project);
                              setIsProjectModalOpen(true);
                            }}
                            className="flex-1 px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(project.id);
                          }}
                          className="flex-1 px-3 py-1 border border-primary text-primary text-sm rounded hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                        >
                          View Tasks
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub-activities - Only show when parent is selected */}
                {selectedProject === project.id &&
                  project.sub_activities &&
                  project.sub_activities.length > 0 && (
                    <div className="mt-3 ml-4 space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <GitBranch size={14} className="text-primary" />
                        <h4 className="text-sm font-semibold text-text dark:text-dark-text">
                          Sub-activities
                        </h4>
                      </div>
                      {project.sub_activities.map((subProject) => (
                        <div
                          key={subProject.id}
                          className={`border-l-4 rounded-lg p-3 cursor-pointer transition-all bg-gray-50 dark:bg-dark-hover hover:shadow-md ${
                            selectedProject === subProject.id
                              ? "border-l-primary bg-primary/5 dark:bg-primary/10"
                              : "border-l-primary/30 hover:border-l-primary/60"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(subProject.id);
                          }}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h5 className="font-medium text-sm text-text dark:text-dark-text truncate pr-2">
                              {subProject.title}
                            </h5>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                subProject.status === "active"
                                  ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                                  : subProject.status === "completed"
                                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {subProject.status}
                            </span>
                          </div>

                          <p
                            className="text-xs text-muted dark:text-dark-muted mb-2 overflow-hidden"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {subProject.description}
                          </p>

                          <div className="grid grid-cols-2 gap-1 text-xs text-muted dark:text-dark-muted">
                            <div className="flex justify-between">
                              <span>Tasks:</span>
                              <span className="font-medium text-text dark:text-dark-text">
                                {subProject.tasks?.length || 0}
                              </span>
                            </div>
                            {subProject.start_date && (
                              <div className="flex justify-between">
                                <span>Start:</span>
                                <span className="text-text dark:text-dark-text">
                                  {new Date(
                                    subProject.start_date
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            )}
                            {subProject.end_date && (
                              <div className="flex justify-between">
                                <span>End:</span>
                                <span className="text-text dark:text-dark-text">
                                  {new Date(
                                    subProject.end_date
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            )}
                          </div>

                          {state.user?.role === "admin" && (
                            <div className="mt-2 pt-2 border-t border-muted/20 dark:border-dark-border">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProject(subProject);
                                  setIsProjectModalOpen(true);
                                }}
                                className="w-full px-2 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90 transition-colors"
                              >
                                Edit Sub-activity
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text dark:text-dark-text">
            Task Management
            {selectedProject && (
              <span className="ml-2 text-base font-normal text-muted dark:text-dark-muted">
                - {state.projects.find((p) => p.id === selectedProject)?.title}
              </span>
            )}
          </h2>
          {selectedProject && (
            <button
              onClick={() => setSelectedProject(null)}
              className="text-sm text-muted dark:text-dark-muted hover:text-text dark:hover:text-dark-text transition-colors"
            >
              View All Projects
            </button>
          )}
        </div>

        {/* Helper Message */}
        {!selectedProject &&
          (state.user?.role === "admin" ||
            state.user?.role === "supervisor") && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                💡 <strong>Tip:</strong> Select a project above to enable task
                creation. Click on any status column to add a new task to that
                stage.
              </p>
            </div>
          )}

        {selectedProject &&
          (state.user?.role === "admin" ||
            state.user?.role === "supervisor") && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-700 dark:text-green-300 text-sm">
                🎯 <strong>Drag & Drop:</strong> Drag tasks between columns to
                change their status. You can also click on any column to create
                new tasks or click existing tasks to edit them. Use the comment
                icon to view and add comments.
              </p>
            </div>
          )}

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Initial Column */}
          <div
            className={`bg-white dark:bg-dark-card rounded-lg border border-muted/20 dark:border-dark-border p-4 transition-all hover:bg-gray-50 dark:hover:bg-dark-hover cursor-pointer ${
              dragOverColumn === "initial"
                ? "bg-primary/10 dark:bg-primary/20 border-primary scale-105"
                : ""
            }`}
            onClick={() => handleColumnClick("initial")}
            onDragOver={(e) => handleDragOver(e, "initial")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "initial")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-text dark:text-dark-text">
                  Initial
                </h2>
                {selectedProject &&
                  (state.user?.role === "admin" ||
                    state.user?.role === "supervisor") && (
                    <Plus size={16} className="text-primary opacity-60" />
                  )}
              </div>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-sm font-medium">
                {tasksByStatus.initial.length}
              </span>
            </div>
            <div className="space-y-3">
              {tasksByStatus.initial.map((task) => (
                <div key={task.id} className="relative group">
                  <TaskCard
                    task={task}
                    onClick={() => handleTaskClick(task)}
                    onDragStart={handleDragStart}
                    isDragging={draggedTask?.id === task.id}
                  />
                  <button
                    onClick={(e) => handleCommentsClick(task, e)}
                    className="absolute top-2 right-2 p-1.5 bg-white dark:bg-dark-bg rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 dark:hover:bg-primary/20"
                    title="View comments"
                  >
                    <MessageSquare size={16} className="text-primary" />
                  </button>
                </div>
              ))}
              {dragOverColumn === "initial" &&
                tasksByStatus.initial.length > 0 && (
                  <div className="p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5">
                    <p className="text-primary font-medium text-center">
                      Drop task here to move to Initial
                    </p>
                  </div>
                )}
              {tasksByStatus.initial.length === 0 && (
                <div className="text-center py-8 text-muted dark:text-dark-muted">
                  <FolderKanban size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No initial tasks</p>
                  {selectedProject &&
                    (state.user?.role === "admin" ||
                      state.user?.role === "supervisor") && (
                      <p className="text-sm mt-2 text-primary">
                        Click to add a task
                      </p>
                    )}
                  {dragOverColumn === "initial" && (
                    <div className="mt-4 p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5">
                      <p className="text-primary font-medium">
                        Drop task here to move to Initial
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div
            className={`bg-white dark:bg-dark-card rounded-lg border border-muted/20 dark:border-dark-border p-4 transition-all hover:bg-gray-50 dark:hover:bg-dark-hover cursor-pointer ${
              dragOverColumn === "in_progress"
                ? "bg-primary/10 dark:bg-primary/20 border-primary scale-105"
                : ""
            }`}
            onClick={() => handleColumnClick("in_progress")}
            onDragOver={(e) => handleDragOver(e, "in_progress")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "in_progress")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-text dark:text-dark-text">
                  In Progress
                </h2>
                {selectedProject &&
                  (state.user?.role === "admin" ||
                    state.user?.role === "supervisor") && (
                    <Plus size={16} className="text-primary opacity-60" />
                  )}
              </div>
              <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full text-sm font-medium">
                {tasksByStatus.in_progress.length}
              </span>
            </div>
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
              {tasksByStatus.in_progress.map((task) => (
                <div key={task.id} className="relative group">
                  <TaskCard
                    task={task}
                    onClick={() => handleTaskClick(task)}
                    onDragStart={handleDragStart}
                    isDragging={draggedTask?.id === task.id}
                  />
                  <button
                    onClick={(e) => handleCommentsClick(task, e)}
                    className="absolute top-2 right-2 p-1.5 bg-white dark:bg-dark-bg rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 dark:hover:bg-primary/20"
                    title="View comments"
                  >
                    <MessageSquare size={16} className="text-primary" />
                  </button>
                </div>
              ))}
              {dragOverColumn === "in_progress" &&
                tasksByStatus.in_progress.length > 0 && (
                  <div className="p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5">
                    <p className="text-primary font-medium text-center">
                      Drop task here to move to In Progress
                    </p>
                  </div>
                )}
              {tasksByStatus.in_progress.length === 0 && (
                <div className="text-center py-8 text-muted dark:text-dark-muted">
                  <FolderKanban size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No tasks in progress</p>
                  {selectedProject &&
                    (state.user?.role === "admin" ||
                      state.user?.role === "supervisor") && (
                      <p className="text-sm mt-2 text-primary">
                        Click to add a task
                      </p>
                    )}
                  {dragOverColumn === "in_progress" && (
                    <div className="mt-4 p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5">
                      <p className="text-primary font-medium">
                        Drop task here to move to In Progress
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div
            className={`bg-white dark:bg-dark-card rounded-lg border border-muted/20 dark:border-dark-border p-4 transition-all hover:bg-gray-50 dark:hover:bg-dark-hover cursor-pointer ${
              dragOverColumn === "completed"
                ? "bg-primary/10 dark:bg-primary/20 border-primary scale-105"
                : ""
            }`}
            onClick={() => handleColumnClick("completed")}
            onDragOver={(e) => handleDragOver(e, "completed")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "completed")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-text dark:text-dark-text">
                  Completed
                </h2>
                {selectedProject &&
                  (state.user?.role === "admin" ||
                    state.user?.role === "supervisor") && (
                    <Plus size={16} className="text-primary opacity-60" />
                  )}
              </div>
              <span className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 px-2 py-1 rounded-full text-sm font-medium">
                {tasksByStatus.completed.length}
              </span>
            </div>
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
              {tasksByStatus.completed.map((task) => (
                <div key={task.id} className="relative group">
                  <TaskCard
                    task={task}
                    onClick={() => handleTaskClick(task)}
                    onDragStart={handleDragStart}
                    isDragging={draggedTask?.id === task.id}
                  />
                  <button
                    onClick={(e) => handleCommentsClick(task, e)}
                    className="absolute top-2 right-2 p-1.5 bg-white dark:bg-dark-bg rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 dark:hover:bg-primary/20"
                    title="View comments"
                  >
                    <MessageSquare size={16} className="text-primary" />
                  </button>
                </div>
              ))}
              {dragOverColumn === "completed" &&
                tasksByStatus.completed.length > 0 && (
                  <div className="p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5">
                    <p className="text-primary font-medium text-center">
                      Drop task here to move to Completed
                    </p>
                  </div>
                )}
              {tasksByStatus.completed.length === 0 && (
                <div className="text-center py-8 text-muted dark:text-dark-muted">
                  <FolderKanban size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No completed tasks</p>
                  {selectedProject &&
                    (state.user?.role === "admin" ||
                      state.user?.role === "supervisor") && (
                      <p className="text-sm mt-2 text-primary">
                        Click to add a task
                      </p>
                    )}
                  {dragOverColumn === "completed" && (
                    <div className="mt-4 p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5">
                      <p className="text-primary font-medium">
                        Drop task here to move to Completed
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project Details */}
      {selectedProject && (
        <div className="bg-white dark:bg-dark-card rounded-lg border border-muted/20 dark:border-dark-border p-6">
          {(() => {
            const project = state.projects.find(
              (p) => p.id === selectedProject
            );
            if (!project) return null;

            return (
              <div>
                <h2 className="text-xl font-semibold text-text dark:text-dark-text mb-2">
                  {project.title}
                </h2>
                <p className="text-muted dark:text-dark-muted mb-4">
                  {project.description}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {project.start_date && (
                    <div>
                      <span className="text-muted dark:text-dark-muted">
                        Start Date:
                      </span>
                      <div className="font-medium text-text dark:text-dark-text">
                        {new Date(project.start_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {project.end_date && (
                    <div>
                      <span className="text-muted dark:text-dark-muted">
                        End Date:
                      </span>
                      <div className="font-medium text-text dark:text-dark-text">
                        {new Date(project.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted dark:text-dark-muted">
                      Created:
                    </span>
                    <div className="font-medium text-text dark:text-dark-text">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted dark:text-dark-muted">
                      Created by:
                    </span>
                    <div className="font-medium text-text dark:text-dark-text">
                      {project.createdBy}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted dark:text-dark-muted">
                      Status:
                    </span>
                    <div
                      className={`font-medium capitalize ${
                        project.status === "active"
                          ? "text-green-600 dark:text-green-400"
                          : project.status === "completed"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {project.status}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted dark:text-dark-muted">
                      Total Tasks:
                    </span>
                    <div className="font-medium text-text dark:text-dark-text">
                      {project.tasks.length}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        mode={editingProject ? "edit" : "create"}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        mode={taskModalMode}
        initialStatus={createTaskStatus}
        projectId={selectedProject || undefined}
      />

      {/* Comments Modal */}
      {commentsTask && (
        <TaskCommentsModal
          isOpen={isCommentsModalOpen}
          onClose={() => {
            setIsCommentsModalOpen(false);
            setCommentsTask(null);
          }}
          task={commentsTask}
        />
      )}
    </div>
  );
}
