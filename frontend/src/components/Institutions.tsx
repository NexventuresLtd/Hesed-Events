import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { apiService } from "../services/api";
import { Building2, Users, Plus, Edit, Trash2 } from "lucide-react";

export function Institutions() {
  const { state, loadInitialData } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    supervisor: "",
    address: "",
    phone: "",
    email: "",
  });
  const [availableSupervisors, setAvailableSupervisors] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const canManageInstitutions = state.user?.role === "admin";

  // Load supervisors when component mounts
  useEffect(() => {
    loadSupervisors();
  }, []);

  const resetFormData = () => ({
    name: "",
    description: "",
    supervisor: "",
    address: "",
    phone: "",
    email: "",
  });

  const loadSupervisors = async () => {
    try {
      const response = await apiService.getUsers();
      const users = response.results || [];
      const supervisors = users.filter(
        (user: any) => user.role === "supervisor"
      );

      setAllUsers(users);
      setAvailableSupervisors(supervisors);
    } catch (error) {
      console.error("Error loading supervisors:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Institution name is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiService.createInstitution({
        name: formData.name.trim(),
        description: formData.description.trim(),
        supervisor: formData.supervisor
          ? parseInt(formData.supervisor)
          : undefined,
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      });

      // Reload data to reflect the new institution
      await loadInitialData();

      // Reset form and close modal
      setFormData(resetFormData());
      setShowAddForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create institution"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInstitution = async (institutionId: string) => {
    if (window.confirm("Are you sure you want to delete this institution?")) {
      try {
        await apiService.deleteInstitution(parseInt(institutionId));
        await loadInitialData(); // Reload data after deletion
      } catch (err) {
        console.error("Error deleting institution:", err);
        alert("Failed to delete institution");
      }
    }
  };

  const handleEditInstitution = (institution: any) => {
    setEditingInstitution(institution);
    setFormData({
      name: institution.name,
      description: institution.description || "",
      supervisor: institution.supervisor?.toString() || "",
      address: institution.address || "",
      phone: institution.phone || "",
      email: institution.email || "",
    });
    setShowEditForm(true);
  };

  const handleUpdateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !editingInstitution) {
      setError("Institution name is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiService.updateInstitution(editingInstitution.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        supervisor: formData.supervisor
          ? parseInt(formData.supervisor)
          : undefined,
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      });

      // Reload data to reflect the changes
      await loadInitialData();

      // Reset form and close modal
      setFormData(resetFormData());
      setShowEditForm(false);
      setEditingInstitution(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update institution"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Institutions</h1>
          <p className="text-muted mt-1">
            Manage organizational units and their supervisors
          </p>
        </div>

        {canManageInstitutions && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Institution</span>
          </button>
        )}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-text mb-4">
              Add New Institution
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Institution Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter institution name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter institution description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Supervisor
                </label>
                <select
                  name="supervisor"
                  value={formData.supervisor}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select a supervisor</option>
                  {availableSupervisors.map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.full_name ||
                        `${supervisor.first_name} ${supervisor.last_name}`.trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter institution address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData(resetFormData());
                    setError(null);
                  }}
                  className="px-4 py-2 text-muted hover:text-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Adding..." : "Add Institution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && editingInstitution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-text mb-4">
              Edit Institution
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateInstitution} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Institution Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter institution name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter institution description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Supervisor
                </label>
                <select
                  name="supervisor"
                  value={formData.supervisor}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select a supervisor</option>
                  {availableSupervisors.map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.full_name ||
                        `${supervisor.first_name} ${supervisor.last_name}`.trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter institution address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingInstitution(null);
                    setFormData(resetFormData());
                    setError(null);
                  }}
                  className="px-4 py-2 text-muted hover:text-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Updating..." : "Update Institution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Institutions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.institutions.map((institution) => {
          // Use backend-calculated values if available, otherwise fallback to frontend calculation
          const totalTasks =
            (institution as any).total_tasks ??
            state.tasks.filter((task) => task.institutionId === institution.id)
              .length;

          const completedTasks =
            (institution as any).completed_tasks ??
            state.tasks.filter(
              (task) =>
                task.institutionId === institution.id &&
                task.status === "completed"
            ).length;

          const completionRate =
            (institution as any).completion_rate ??
            (totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0);

          // Count team members directly from users data
          const teamMemberCount = allUsers.filter(
            (user) => user.institution === parseInt(institution.id)
          ).length;

          return (
            <div
              key={institution.id}
              className="bg-white rounded-lg border border-muted/20 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building2 size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">
                      {institution.name}
                    </h3>
                    <p className="text-sm text-muted">Institution</p>
                  </div>
                </div>

                {canManageInstitutions && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditInstitution(institution)}
                      className="p-2 text-muted hover:text-primary transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteInstitution(institution.id)}
                      className="p-2 text-muted hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Total Tasks</span>
                  <span className="text-sm font-medium text-text">
                    {totalTasks}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Completed</span>
                  <span className="text-sm font-medium text-text">
                    {completedTasks}
                  </span>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted">Progress</span>
                    <span className="font-medium text-text">
                      {completionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-muted/20 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-muted/20">
                  <div className="flex items-center text-sm text-muted">
                    <Users size={14} className="mr-2" />
                    <span>{teamMemberCount} team members</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.institutions.length === 0 && (
        <div className="text-center py-12">
          <Building2 size={48} className="mx-auto text-muted opacity-50 mb-4" />
          <p className="text-muted">No institutions found</p>
          {canManageInstitutions && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-primary hover:underline"
            >
              Add your first institution
            </button>
          )}
        </div>
      )}
    </div>
  );
}
