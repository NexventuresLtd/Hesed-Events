import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import {
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Filter,
  Search,
} from "lucide-react";

// Interface for the paginated API response
interface PaginatedTaskResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TaskOverview[];
}

// Interface for the actual task data returned by the backend API
interface TaskOverview {
  id: number;
  title: string;
  description: string;
  project_title: string;
  assignee_name: string;
  status: "initial" | "in_progress" | "completed";
  progress: number;
  due_date: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  initial: {
    label: "Not Started",
    color: "bg-gray-100 text-gray-700",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
    icon: BarChart3,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
};

export function Overview() {
  const [tasks, setTasks] = useState<TaskOverview[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [overdueFilter, setOverdueFilter] = useState<string>("all");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter, overdueFilter]);

  const loadTasks = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTasks() as unknown as PaginatedTaskResponse;
      // Extract the tasks and pagination info from the response
      setTasks(response.results);
      setTotalCount(response.count);
      setHasNext(response.next !== null);
      setHasPrevious(response.previous !== null);
      setCurrentPage(page);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.assignee_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    // Overdue filter
    if (overdueFilter === "overdue") {
      filtered = filtered.filter((task) => task.is_overdue);
    } else if (overdueFilter === "not_overdue") {
      filtered = filtered.filter((task) => !task.is_overdue);
    }

    setFilteredTasks(filtered);
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

  const getDaysUntilDue = (dueDateString: string | null) => {
    if (!dueDateString) return null;
    const dueDate = new Date(dueDateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text">Task Overview</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted">Loading tasks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text">Task Overview</h1>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => loadTasks()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks && tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "in_progress"
  ).length;
  const overdueTasks = tasks.filter((task) => task.is_overdue).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Task Overview</h1>
          <p className="text-muted">
            Comprehensive view of all tasks across projects
          </p>
        </div>
        <button
          onClick={() => loadTasks()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-12">
              <p className="text-sm text-muted">Total Tasks</p>
              <p className="text-2xl font-bold text-text">{totalTasks}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-12">
              <p className="text-sm text-muted">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {completedTasks}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-12">
              <p className="text-sm text-muted">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {inProgressTasks}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-12">
              <p className="text-sm text-muted">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-muted/20">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search tasks, projects, or assignees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="initial">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Overdue Filter */}
          <div>
            <select
              value={overdueFilter}
              onChange={(e) => setOverdueFilter(e.target.value)}
              className="px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Tasks</option>
              <option value="overdue">Overdue Only</option>
              <option value="not_overdue">Not Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg border border-muted/20 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted mb-4">No tasks found</div>
            {(searchTerm ||
              statusFilter !== "all" ||
              overdueFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setOverdueFilter("all");
                }}
                className="text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/5 border-b border-muted/20">
                  <tr>
                    <th className="text-left p-4 font-medium text-text">
                      Task
                    </th>
                    <th className="text-left p-4 font-medium text-text">
                      Project
                    </th>
                    <th className="text-left p-4 font-medium text-text">
                      Assigned To
                    </th>
                    <th className="text-left p-4 font-medium text-text">
                      Status
                    </th>
                    <th className="text-left p-4 font-medium text-text">
                      Progress
                    </th>
                    <th className="text-left p-4 font-medium text-text">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const statusInfo =
                      statusConfig[task.status as keyof typeof statusConfig];
                    const StatusIcon = statusInfo.icon;
                    const daysUntilDue = getDaysUntilDue(task.due_date);

                    return (
                      <tr
                        key={task.id}
                        className="border-b border-muted/10 hover:bg-muted/5 transition-colors"
                      >
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-text">
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="text-sm text-muted mt-1 truncate max-w-56">
                                {task.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-text">{task.project_title}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <User size={16} className="text-muted" />
                            <span className="text-text">
                              {task.assignee_name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-nowrap ${statusInfo.color}`}
                          >
                            <StatusIcon size={12} />
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                                  task.progress
                                )}`}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-text">
                              {task.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-muted" />
                            <div>
                              <div className="text-text">
                                {formatDate(task.due_date)}
                              </div>
                              {task.is_overdue ? (
                                <div className="text-xs text-red-600 font-medium">
                                  Overdue
                                </div>
                              ) : (
                                daysUntilDue !== null && (
                                  <div
                                    className={`text-xs ${
                                      daysUntilDue <= 3
                                        ? "text-red-600"
                                        : daysUntilDue <= 7
                                        ? "text-yellow-600"
                                        : "text-muted"
                                    }`}
                                  >
                                    {daysUntilDue > 0
                                      ? `${daysUntilDue} days left`
                                      : daysUntilDue === 0
                                      ? "Due today"
                                      : `${Math.abs(
                                          daysUntilDue
                                        )} days overdue`}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {filteredTasks.map((task) => {
                const statusInfo =
                  statusConfig[task.status as keyof typeof statusConfig];
                const StatusIcon = statusInfo.icon;
                const daysUntilDue = getDaysUntilDue(task.due_date);

                return (
                  <div
                    key={task.id}
                    className="border border-muted/20 rounded-lg p-4 space-y-3"
                  >
                    <div>
                      <h3 className="font-medium text-text">{task.title}</h3>
                      <p className="text-sm text-muted">{task.project_title}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User size={16} className="text-muted" />
                        <span className="text-sm text-text">
                          {task.assignee_name}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                      >
                        <StatusIcon size={12} />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted">Progress</span>
                        <span className="text-sm text-text">
                          {task.progress}%
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                            task.progress
                          )}`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar size={16} className="text-muted" />
                      <div>
                        <div className="text-sm text-text">
                          {formatDate(task.due_date)}
                        </div>
                        {task.is_overdue ? (
                          <div className="text-xs text-red-600 font-medium">
                            Overdue
                          </div>
                        ) : (
                          daysUntilDue !== null && (
                            <div
                              className={`text-xs ${
                                daysUntilDue <= 3
                                  ? "text-red-600"
                                  : daysUntilDue <= 7
                                  ? "text-yellow-600"
                                  : "text-muted"
                              }`}
                            >
                              {daysUntilDue > 0
                                ? `${daysUntilDue} days left`
                                : daysUntilDue === 0
                                ? "Due today"
                                : `${Math.abs(daysUntilDue)} days overdue`}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {(hasNext || hasPrevious) && (
              <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-lg border border-muted/20">
                <div className="text-sm text-muted">
                  Showing {filteredTasks.length} of {totalCount} tasks
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => loadTasks(currentPage - 1)}
                    disabled={!hasPrevious}
                    className={`px-3 py-1 rounded ${
                      hasPrevious
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    } transition-colors`}
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-text">
                    Page {currentPage}
                  </span>
                  <button
                    onClick={() => loadTasks(currentPage + 1)}
                    disabled={!hasNext}
                    className={`px-3 py-1 rounded ${
                      hasNext
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    } transition-colors`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
