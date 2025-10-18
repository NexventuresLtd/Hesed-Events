import { useState } from "react";
import { useApp } from "../context/AppContext";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { TaskCommentsModal } from "./TaskCommentsModal";
import { Plus, ListChecks, Filter, Search, MessageSquare } from "lucide-react";
import { apiService } from "../services/api";
import type { Task } from "../types";

export function Tasks() {
  const { state, loadInitialData } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Task["status"]>(
    "all"
  );
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [institutionFilter, setInstitutionFilter] = useState<string | null>(
    null
  );
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
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

  // Filter tasks based on all criteria
  const filteredTasks = state.tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.institutionName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesProject = !projectFilter || task.projectId === projectFilter;
    const matchesInstitution =
      !institutionFilter || task.institutionId === institutionFilter;
    const matchesAssignee =
      !assigneeFilter || task.assigneeId === assigneeFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProject &&
      matchesInstitution &&
      matchesAssignee
    );
  });

  // Group tasks by status for kanban view
  const tasksByStatus = {
    initial: filteredTasks.filter((task) => task.status === "initial"),
    in_progress: filteredTasks.filter((task) => task.status === "in_progress"),
    completed: filteredTasks.filter((task) => task.status === "completed"),
  };

  const canCreateTask =
    state.user?.role === "admin" || state.user?.role === "supervisor";

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
    if (canCreateTask) {
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
    if (!canCreateTask) {
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

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setProjectFilter(null);
    setInstitutionFilter(null);
    setAssigneeFilter(null);
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "all" ||
    projectFilter ||
    institutionFilter ||
    assigneeFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text dark:text-dark-text">
            All Tasks
          </h1>
          <p className="text-muted dark:text-dark-muted mt-1">
            Manage and track all tasks across projects
          </p>
        </div>

        {canCreateTask && (
          <button
            onClick={() => handleCreateTask("initial")}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Plus size={20} />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-card rounded-lg border border-muted/20 dark:border-dark-border p-4">
        <div className="space-y-4">
          {/* First Row: Search and Quick Filters */}
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

            {/* Project Filter */}
            <select
              value={projectFilter || ""}
              onChange={(e) => setProjectFilter(e.target.value || null)}
              className="px-3 py-2 border border-muted/30 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-dark-bg text-text dark:text-dark-text"
            >
              <option value="">All Projects</option>
              {state.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>

            {/* Results Count */}
            <div className="flex items-center justify-between text-sm text-muted dark:text-dark-muted">
              <div className="flex items-center">
                <ListChecks size={16} className="mr-2" />
                {filteredTasks.length} task
                {filteredTasks.length !== 1 ? "s" : ""}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-primary hover:text-primary/80 text-xs underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Second Row: Additional Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Institution Filter */}
            <select
              value={institutionFilter || ""}
              onChange={(e) => setInstitutionFilter(e.target.value || null)}
              className="px-3 py-2 border border-muted/30 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-dark-bg text-text dark:text-dark-text"
            >
              <option value="">All Institutions</option>
              {state.institutions.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.name}
                </option>
              ))}
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter || ""}
              onChange={(e) => setAssigneeFilter(e.target.value || null)}
              className="px-3 py-2 border border-muted/30 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-dark-bg text-text dark:text-dark-text"
            >
              <option value="">All Assignees</option>
              {state.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Helper Message */}
      {canCreateTask && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-700 dark:text-green-300 text-sm">
            🎯 <strong>Drag & Drop:</strong> Drag tasks between columns to
            change their status. Click on any column header to create new tasks
            or click existing tasks to edit them. Use the comment icon to view
            and add comments.
          </p>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Initial Column */}
        <div
          className={`bg-white dark:bg-dark-card rounded-lg border border-muted/20 dark:border-dark-border p-4 transition-all ${
            canCreateTask
              ? "hover:bg-gray-50 dark:hover:bg-dark-hover cursor-pointer"
              : ""
          } ${
            dragOverColumn === "initial"
              ? "bg-primary/10 dark:bg-primary/20 border-primary scale-105"
              : ""
          }`}
          onClick={() => canCreateTask && handleColumnClick("initial")}
          onDragOver={(e) => handleDragOver(e, "initial")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "initial")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-text dark:text-dark-text">
                Initial
              </h2>
              {canCreateTask && (
                <Plus size={16} className="text-primary opacity-60" />
              )}
            </div>
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-sm font-medium">
              {tasksByStatus.initial.length}
            </span>
          </div>
          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
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
                <div className="p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5 dark:bg-primary/10">
                  <p className="text-primary font-medium text-center">
                    Drop task here to move to Initial
                  </p>
                </div>
              )}
            {tasksByStatus.initial.length === 0 && (
              <div className="text-center py-8 text-muted dark:text-dark-muted">
                <ListChecks size={48} className="mx-auto mb-4 opacity-50" />
                <p>No initial tasks</p>
                {canCreateTask && (
                  <p className="text-sm mt-2 text-primary">
                    Click to add a task
                  </p>
                )}
                {dragOverColumn === "initial" && (
                  <div className="mt-4 p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5 dark:bg-primary/10">
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
          className={`bg-white dark:bg-dark-card rounded-lg border border-muted/20 dark:border-dark-border p-4 transition-all ${
            canCreateTask
              ? "hover:bg-gray-50 dark:hover:bg-dark-hover cursor-pointer"
              : ""
          } ${
            dragOverColumn === "in_progress"
              ? "bg-primary/10 dark:bg-primary/20 border-primary scale-105"
              : ""
          }`}
          onClick={() => canCreateTask && handleColumnClick("in_progress")}
          onDragOver={(e) => handleDragOver(e, "in_progress")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "in_progress")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-text dark:text-dark-text">
                In Progress
              </h2>
              {canCreateTask && (
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
                <div className="p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5 dark:bg-primary/10">
                  <p className="text-primary font-medium text-center">
                    Drop task here to move to In Progress
                  </p>
                </div>
              )}
            {tasksByStatus.in_progress.length === 0 && (
              <div className="text-center py-8 text-muted dark:text-dark-muted">
                <ListChecks size={48} className="mx-auto mb-4 opacity-50" />
                <p>No tasks in progress</p>
                {canCreateTask && (
                  <p className="text-sm mt-2 text-primary">
                    Click to add a task
                  </p>
                )}
                {dragOverColumn === "in_progress" && (
                  <div className="mt-4 p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5 dark:bg-primary/10">
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
          className={`bg-white dark:bg-dark-card rounded-lg border border-muted/20 dark:border-dark-border p-4 transition-all ${
            canCreateTask
              ? "hover:bg-gray-50 dark:hover:bg-dark-hover cursor-pointer"
              : ""
          } ${
            dragOverColumn === "completed"
              ? "bg-primary/10 dark:bg-primary/20 border-primary scale-105"
              : ""
          }`}
          onClick={() => canCreateTask && handleColumnClick("completed")}
          onDragOver={(e) => handleDragOver(e, "completed")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "completed")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-text dark:text-dark-text">
                Completed
              </h2>
              {canCreateTask && (
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
                <div className="p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5 dark:bg-primary/10">
                  <p className="text-primary font-medium text-center">
                    Drop task here to move to Completed
                  </p>
                </div>
              )}
            {tasksByStatus.completed.length === 0 && (
              <div className="text-center py-8 text-muted dark:text-dark-muted">
                <ListChecks size={48} className="mx-auto mb-4 opacity-50" />
                <p>No completed tasks</p>
                {canCreateTask && (
                  <p className="text-sm mt-2 text-primary">
                    Click to add a task
                  </p>
                )}
                {dragOverColumn === "completed" && (
                  <div className="mt-4 p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5 dark:bg-primary/10">
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
      />

      {/* Comments Modal */}
      {commentsTask && (
        <TaskCommentsModal
          isOpen={isCommentsModalOpen}
          onClose={() => {
            setIsCommentsModalOpen(false);
            setCommentsTask(null);
          }}
          taskId={parseInt(commentsTask.id)}
          taskTitle={commentsTask.title}
        />
      )}
    </div>
  );
}
