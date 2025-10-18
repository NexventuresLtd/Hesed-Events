import { useEffect, useState } from "react";
import { X, Save, Loader } from "lucide-react";
import { useApp } from "../context/AppContext";
import { apiService } from "../services/api";
import type { Project } from "../types";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  mode: "create" | "edit";
}

export function ProjectModal({
  isOpen,
  onClose,
  project,
  mode,
}: ProjectModalProps) {
  const { loadInitialData, state } = useApp();
  const [formData, setFormData] = useState({
    title: project?.title || "",
    description: project?.description || "",
    status:
      project?.status ||
      ("active" as "active" | "completed" | "planning" | "on_hold"),
    parent_project: project?.parent_project || "",
    start_date: project?.start_date ? project.start_date.split("T")[0] : "",
    end_date: project?.end_date ? project.end_date.split("T")[0] : "",
  });
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        description: project.description || "",
        status:
          project.status ||
          ("active" as "active" | "completed" | "planning" | "on_hold"),
        parent_project: project.parent_project || "",
        start_date: project.start_date ? project.start_date.split("T")[0] : "",
        end_date: project.end_date ? project.end_date.split("T")[0] : "",
      });
    } else {
      // Reset form when creating a new project
      setFormData({
        title: "",
        description: "",
        status: "active",
        parent_project: "",
        start_date: "",
        end_date: "",
      });
    }
  }, [project, isOpen]); // re-run whenever project or modal open state changes

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Get available parent projects (exclude current project if editing)
  const availableParentProjects = state.projects.filter(
    (p) => p.id !== project?.id && !p.is_sub_activity
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const projectData: any = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        parent_project: formData.parent_project || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      };

      if (mode === "create") {
        await apiService.createProject(projectData);
      } else if (project) {
        await apiService.updateProject(parseInt(project.id), projectData);
      }

      // Reload data to get updated projects
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-muted/20">
          <h2 className="text-xl font-semibold text-text">
            {mode === "create" ? "Create New Project" : "Edit Project"}
          </h2>
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
              Project Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter project title"
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
              rows={4}
              className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter project description"
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
              onChange={handleChange}
              className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="planning">Planning</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="parent_project"
              className="block text-sm font-medium text-text mb-2"
            >
              Parent Project (Optional - for Sub-Activities)
            </label>
            <select
              id="parent_project"
              name="parent_project"
              value={formData.parent_project}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">None - This is a main project</option>
              {availableParentProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-medium text-text mb-2"
              >
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="end_date"
                className="block text-sm font-medium text-text mb-2"
              >
                End Date
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
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
              <span>{mode === "create" ? "Create" : "Update"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
