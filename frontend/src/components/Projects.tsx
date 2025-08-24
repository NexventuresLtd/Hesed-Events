import { useState } from "react";
import { useApp } from "../context/AppContext";
import { TaskCard } from "./TaskCard";
import { ProjectModal } from "./ProjectModal";
import { TaskModal } from "./TaskModal";
import { Plus, FolderKanban, Filter, Search } from "lucide-react";
import type { Task } from "../types";

export function Projects() {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Task["status"]>(
    "all"
  );
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Projects</h1>
          <p className="text-muted mt-1">
            Manage and track all project activities
          </p>
        </div>

        {canCreateProject && (
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-muted/20 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Initial Column */}
        <div className="bg-white rounded-lg border border-muted/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text">Initial</h2>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm font-medium">
              {tasksByStatus.initial.length}
            </span>
          </div>
          <div className="space-y-3">
            {tasksByStatus.initial.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => handleTaskClick(task)}
              />
            ))}
            {tasksByStatus.initial.length === 0 && (
              <div className="text-center py-8 text-muted">
                <FolderKanban size={48} className="mx-auto mb-4 opacity-50" />
                <p>No initial tasks</p>
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-white rounded-lg border border-muted/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text">In Progress</h2>
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm font-medium">
              {tasksByStatus.in_progress.length}
            </span>
          </div>
          <div className="space-y-3">
            {tasksByStatus.in_progress.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => handleTaskClick(task)}
              />
            ))}
            {tasksByStatus.in_progress.length === 0 && (
              <div className="text-center py-8 text-muted">
                <FolderKanban size={48} className="mx-auto mb-4 opacity-50" />
                <p>No tasks in progress</p>
              </div>
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-white rounded-lg border border-muted/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text">Completed</h2>
            <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-sm font-medium">
              {tasksByStatus.completed.length}
            </span>
          </div>
          <div className="space-y-3">
            {tasksByStatus.completed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => handleTaskClick(task)}
              />
            ))}
            {tasksByStatus.completed.length === 0 && (
              <div className="text-center py-8 text-muted">
                <FolderKanban size={48} className="mx-auto mb-4 opacity-50" />
                <p>No completed tasks</p>
              </div>
            )}
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
      />
    </div>
  );
}
