import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Building2, Users, Plus, Edit, Trash2 } from "lucide-react";

export function Institutions() {
  const { state } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);

  const canManageInstitutions = state.user?.role === "admin";

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
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Institution Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter institution name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Supervisor
                </label>
                <select className="w-full px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">Select a supervisor</option>
                  <option value="1">Jane Smith</option>
                  <option value="2">Bob Wilson</option>
                  <option value="3">Alice Brown</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-muted hover:text-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Add Institution
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
                    <button className="p-2 text-muted hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Supervisor</span>
                  <span className="text-sm font-medium text-text">
                    {institution.supervisorName}
                  </span>
                </div>

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
