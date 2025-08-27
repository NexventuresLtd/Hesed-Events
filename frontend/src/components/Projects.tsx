import { useState } from "react";
import { useApp } from "../context/AppContext";
import { TaskCard } from "./TaskCard";
import { ProjectModal } from "./ProjectModal";
import { TaskModal } from "./TaskModal";
import { Plus, FolderKanban, Filter, Search } from "lucide-react";
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
          <h1 className="text-2xl sm:text-3xl font-bold text-text">Projects</h1>
          <p className="text-muted mt-1">
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
      <div className="bg-white rounded-lg border border-muted/20 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Project Filter */}
          <select
            value={selectedProject || ""}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | Task["status"])
              }
              className="w-full pl-10 pr-4 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
            >
              <option value="all">All Status</option>
              <option value="initial">Initial</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center text-sm text-muted">
            <FolderKanban size={16} className="mr-2" />
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="bg-white rounded-lg border border-muted/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text">All Projects</h2>
          <span className="text-sm text-muted">
            {state.projects.length} project
            {state.projects.length !== 1 ? "s" : ""}
          </span>
        </div>

        {state.projects.length === 0 ? (
          <div className="text-center py-8 text-muted">
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
            {state.projects.map((project) => (
              <div
                key={project.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedProject === project.id
                    ? "border-primary bg-primary/5"
                    : "border-muted/30 hover:border-primary/50"
                }`}
                onClick={() =>
                  setSelectedProject(
                    selectedProject === project.id ? null : project.id
                  )
                }
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-text truncate pr-2">
                    {project.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      project.status === "active"
                        ? "bg-green-100 text-green-700"
                        : project.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <p
                  className="text-sm text-muted mb-3 overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {project.description}
                </p>

                <div className="space-y-1 text-xs text-muted">
                  <div className="flex justify-between">
                    <span>Tasks:</span>
                    <span className="font-medium">
                      {project.tasks?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created by:</span>
                    <span className="font-medium">{project.createdBy}</span>
                  </div>
                </div>

                {selectedProject === project.id && (
                  <div className="mt-3 pt-3 border-t border-muted/20">
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
                          // Focus on this project in the kanban view
                          setSelectedProject(project.id);
                        }}
                        className="flex-1 px-3 py-1 border border-primary text-primary text-sm rounded hover:bg-primary/10 transition-colors"
                      >
                        View Tasks
                      </button>
                    </div>
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
          <h2 className="text-xl font-semibold text-text">
            Task Management
            {selectedProject && (
              <span className="ml-2 text-base font-normal text-muted">
                - {state.projects.find((p) => p.id === selectedProject)?.title}
              </span>
            )}
          </h2>
          {selectedProject && (
            <button
              onClick={() => setSelectedProject(null)}
              className="text-sm text-muted hover:text-text transition-colors"
            >
              View All Projects
            </button>
          )}
        </div>

        {/* Helper Message */}
        {!selectedProject &&
          (state.user?.role === "admin" ||
            state.user?.role === "supervisor") && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                💡 <strong>Tip:</strong> Select a project above to enable task
                creation. Click on any status column to add a new task to that
                stage.
              </p>
            </div>
          )}

        {selectedProject &&
          (state.user?.role === "admin" ||
            state.user?.role === "supervisor") && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 text-sm">
                🎯 <strong>Drag & Drop:</strong> Drag tasks between columns to
                change their status. You can also click on any column to create
                new tasks or click existing tasks to edit them.
              </p>
            </div>
          )}

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Initial Column */}
          <div
            className={`bg-white rounded-lg border border-muted/20 p-4 transition-all hover:bg-gray-50 cursor-pointer ${
              dragOverColumn === "initial"
                ? "bg-primary/10 border-primary scale-105"
                : ""
            }`}
            onClick={() => handleColumnClick("initial")}
            onDragOver={(e) => handleDragOver(e, "initial")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "initial")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-text">Initial</h2>
                {selectedProject &&
                  (state.user?.role === "admin" ||
                    state.user?.role === "supervisor") && (
                    <Plus size={16} className="text-primary opacity-60" />
                  )}
              </div>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm font-medium">
                {tasksByStatus.initial.length}
              </span>
            </div>
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
              {tasksByStatus.initial.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => handleTaskClick(task)}
                  onDragStart={handleDragStart}
                  isDragging={draggedTask?.id === task.id}
                />
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
                <div className="text-center py-8 text-muted">
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
            className={`bg-white rounded-lg border border-muted/20 p-4 transition-all hover:bg-gray-50 cursor-pointer ${
              dragOverColumn === "in_progress"
                ? "bg-primary/10 border-primary scale-105"
                : ""
            }`}
            onClick={() => handleColumnClick("in_progress")}
            onDragOver={(e) => handleDragOver(e, "in_progress")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "in_progress")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-text">In Progress</h2>
                {selectedProject &&
                  (state.user?.role === "admin" ||
                    state.user?.role === "supervisor") && (
                    <Plus size={16} className="text-primary opacity-60" />
                  )}
              </div>
              <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm font-medium">
                {tasksByStatus.in_progress.length}
              </span>
            </div>
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
              {tasksByStatus.in_progress.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => handleTaskClick(task)}
                  onDragStart={handleDragStart}
                  isDragging={draggedTask?.id === task.id}
                />
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
                <div className="text-center py-8 text-muted">
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
            className={`bg-white rounded-lg border border-muted/20 p-4 transition-all hover:bg-gray-50 cursor-pointer ${
              dragOverColumn === "completed"
                ? "bg-primary/10 border-primary scale-105"
                : ""
            }`}
            onClick={() => handleColumnClick("completed")}
            onDragOver={(e) => handleDragOver(e, "completed")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "completed")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-text">Completed</h2>
                {selectedProject &&
                  (state.user?.role === "admin" ||
                    state.user?.role === "supervisor") && (
                    <Plus size={16} className="text-primary opacity-60" />
                  )}
              </div>
              <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-sm font-medium">
                {tasksByStatus.completed.length}
              </span>
            </div>
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
              {tasksByStatus.completed.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => handleTaskClick(task)}
                  onDragStart={handleDragStart}
                  isDragging={draggedTask?.id === task.id}
                />
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
                <div className="text-center py-8 text-muted">
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
        <div className="bg-white rounded-lg border border-muted/20 p-6">
          {(() => {
            const project = state.projects.find(
              (p) => p.id === selectedProject
            );
            if (!project) return null;

            return (
              <div>
                <h2 className="text-xl font-semibold text-text mb-2">
                  {project.title}
                </h2>
                <p className="text-muted mb-4">{project.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted">Created:</span>
                    <div className="font-medium text-text">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted">Created by:</span>
                    <div className="font-medium text-text">
                      {project.createdBy}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted">Status:</span>
                    <div
                      className={`font-medium capitalize ${
                        project.status === "active"
                          ? "text-green-600"
                          : project.status === "completed"
                          ? "text-blue-600"
                          : "text-gray-600"
                      }`}
                    >
                      {project.status}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted">Total Tasks:</span>
                    <div className="font-medium text-text">
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
    </div>
  );
}
