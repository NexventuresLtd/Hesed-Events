import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { UserModal } from "./UserModal";
import { apiService } from "../services/api";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  UserCheck,
  MoreVertical,
  Loader,
} from "lucide-react";
import type { User } from "../types";

export function UsersPage() {
  const { state, loadInitialData } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "admin" | "supervisor" | "employee" | "observer"
  >("all");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load users from API on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedUsers = await apiService.getUsers();
      
      // Convert API users to frontend format
      const convertedUsers: User[] = (fetchedUsers as any)?.results?.map((user: any) => ({
        id: user.id.toString(),
        name: `${user.first_name} ${user.last_name}`.trim() || user.username,
        email: user.email,
        role: user.role,
        institutionId: user.institution?.toString() || undefined,
        institutionName: user.institution_name || undefined,
      }));
      
      setUsers(convertedUsers);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users");
      // Fallback to current user if API fails
      setUsers(state.user ? [state.user] : []);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const canManageUsers = state.user?.role === "admin";

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await apiService.deleteUser(parseInt(userId));
        await loadUsers(); // Reload users after deletion
        await loadInitialData(); // Also refresh the app context
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user");
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "supervisor":
        return "bg-blue-100 text-blue-800";
      case "employee":
        return "bg-green-100 text-green-800";
      case "observer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">User Management</h1>
          <p className="text-muted mt-1">
            Manage user accounts and permissions
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={() => setIsUserModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-muted/20 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="employee">Employee</option>
            <option value="observer">Observer</option>
          </select>

          {/* Results Count */}
          <div className="flex items-center text-sm text-muted">
            <Users size={16} className="mr-2" />
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/10">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-text">
                  User
                </th>
                <th className="text-left px-6 py-4 font-semibold text-text">
                  Role
                </th>
                <th className="text-left px-6 py-4 font-semibold text-text">
                  Institution
                </th>
                <th className="text-left px-6 py-4 font-semibold text-text">
                  Status
                </th>
                {canManageUsers && (
                  <th className="text-left px-6 py-4 font-semibold text-text">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-muted/5"}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-text">{user.name}</div>
                      <div className="text-sm text-muted">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-text">
                      {user.institutionName || "No institution"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <UserCheck size={16} className="text-green-600" />
                      <span className="text-sm text-green-600">Active</span>
                    </div>
                  </td>
                  {canManageUsers && (
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-muted hover:text-text hover:bg-muted/10 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 text-muted opacity-50" />
              <p className="text-muted">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        mode={editingUser ? "edit" : "create"}
      />
    </div>
  );
}
