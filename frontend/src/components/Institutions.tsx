import { useState } from "react";
import { useApp } from "../context/AppContext";
import { apiService } from "../services/api";
import { Building2, Users, Plus, Edit, Trash2 } from "lucide-react";

export function Institutions() {
  const { state, loadInitialData } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    supervisor: "",
  });

  const canManageInstitutions = state.user?.role === "admin";

  // For now, we'll create a simple institution without supervisor
  // The supervisor functionality can be added later when the backend supports it

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
        type: "Educational", // Default type
        location: "", // Default empty location
      });

      // Reload data to reflect the new institution
      await loadInitialData();

      // Reset form and close modal
      setFormData({ name: "", supervisor: "" });
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
                  Institution Name
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
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: "", supervisor: "" });
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

      {/* Institutions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.institutions.map((institution) => {
          const institutionTasks = state.tasks.filter(
            (task) => task.institutionId === institution.id
          );
          const completedTasks = institutionTasks.filter(
            (task) => task.status === "completed"
          ).length;
          const completionRate =
            institutionTasks.length > 0
              ? Math.round((completedTasks / institutionTasks.length) * 100)
              : 0;

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
                    <button className="p-2 text-muted hover:text-primary transition-colors">
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
                    {institutionTasks.length}
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
                    <span>
                      {
                        state.tasks
                          .filter(
                            (task) => task.institutionId === institution.id
                          )
                          .map((task) => task.assigneeId)
                          .filter(
                            (id, index, self) => self.indexOf(id) === index
                          ).length
                      }{" "}
                      team members
                    </span>
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
