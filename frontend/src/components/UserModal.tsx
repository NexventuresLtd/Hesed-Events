import { useState } from "react";
import { X, Save, Loader } from "lucide-react";
import { useApp } from "../context/AppContext";
import { apiService } from "../services/api";
import type { User } from "../types";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  mode: "create" | "edit";
}

export function UserModal({ isOpen, onClose, user, mode }: UserModalProps) {
  const { loadInitialData } = useApp();
  const [formData, setFormData] = useState({
    username: user?.name || "",
    email: user?.email || "",
    first_name: "",
    last_name: "",
    role:
      user?.role ||
      ("employee" as "admin" | "supervisor" | "employee" | "observer"),
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords for new users
    if (mode === "create" && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (mode === "create" && formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      if (mode === "create") {
        await apiService.createUser({
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          password: formData.password,
        });
      } else if (user) {
        await apiService.updateUser(parseInt(user.id), {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
        });
      }

      // Reload data to get updated users
      await loadInitialData();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-muted/20">
          <h2 className="text-xl font-semibold text-text">
            {mode === "create" ? "Create New User" : "Edit User"}
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
              htmlFor="username"
              className="block text-sm font-medium text-text mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Enter email"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-text mb-2"
              >
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="First name"
              />
            </div>
            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-text mb-2"
              >
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-text mb-2"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="employee">Employee</option>
              <option value="observer">Observer</option>
            </select>
          </div>

          {mode === "create" && (
            <>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-text mb-2"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Confirm password"
                />
              </div>
            </>
          )}

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
