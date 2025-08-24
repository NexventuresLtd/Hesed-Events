import { useState } from "react";
import { X, Save, Loader } from "lucide-react";
import { useApp } from "../context/AppContext";
import { apiService } from "../services/api";
import type { Task } from "../types";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export function TaskModal({ isOpen, onClose, task }: TaskModalProps) {
  const { state, loadInitialData } = useApp();
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status:
      task?.status || ("initial" as "initial" | "in_progress" | "completed"),
    progress: task?.progress || 0,
    assigneeId: task?.assigneeId || "",
    dueDate: task?.dueDate ? task.dueDate.split("T")[0] : "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await apiService.updateTask(parseInt(task.id), {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        progress: formData.progress,
        assignee: formData.assigneeId ? parseInt(formData.assigneeId) : null,
        due_date: formData.dueDate || null,
      } as any);

      // Reload data to get updated tasks
      await loadInitialData();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "progress" ? parseInt(value) || 0 : value,
    }));
  };

  const handleStatusChange = (
    newStatus: "initial" | "in_progress" | "completed"
  ) => {
    let newProgress = formData.progress;
    if (newStatus === "initial") newProgress = 0;
    else if (newStatus === "in_progress" && newProgress === 0) newProgress = 50;
    else if (newStatus === "completed") newProgress = 100;

    setFormData((prev) => ({
      ...prev,
      status: newStatus,
      progress: newProgress,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-muted/20">
          <h2 className="text-xl font-semibold text-text">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-text mb-2"
            >
              Task Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-text mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter task description"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-text mb-2"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={(e) =>
                handleStatusChange(
                  e.target.value as "initial" | "in_progress" | "completed"
                )
              }
              className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="initial">Initial</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="progress"
              className="block text-sm font-medium text-text mb-2"
            >
              Progress ({formData.progress}%)
            </label>
            <input
              type="range"
              id="progress"
              name="progress"
              min="0"
              max="100"
              value={formData.progress}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="assigneeId"
              className="block text-sm font-medium text-text mb-2"
            >
              Assignee
            </label>
            <select
              id="assigneeId"
              name="assigneeId"
              value={formData.assigneeId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Unassigned</option>
              {state.user && (
                <option value={state.user.id}>{state.user.name}</option>
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-text mb-2"
            >
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-muted/30 text-muted hover:bg-muted/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
