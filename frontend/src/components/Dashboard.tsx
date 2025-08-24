import { useApp } from "../context/AppContext";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Users,
} from "lucide-react";
import { TaskCard } from "./TaskCard";
import { StatsCard } from "./StatsCard";

export function Dashboard() {
  const { state } = useApp();

  const recentTasks = state.tasks
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 6);

  const statsCards = [
    {
      title: "Total Projects",
      value: state.stats.totalProjects,
      icon: FolderKanban,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Completed Tasks",
      value: state.stats.completedTasks,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "In Progress",
      value: state.stats.inProgressTasks,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Overdue",
      value: state.stats.overdueTask,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Institutions",
      value: state.stats.institutionsCount,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Active Users",
      value: state.stats.activeUsers,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text">Dashboard</h1>
        <p className="text-muted mt-1">
          Welcome back, {state.user?.name}! Here's what's happening with your
          projects.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks by Status */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-muted/20 p-6">
            <h2 className="text-xl font-semibold text-text mb-4">
              Recent Task Updates
            </h2>

            {recentTasks.length > 0 ? (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted">
                <FolderKanban size={48} className="mx-auto mb-4 opacity-50" />
                <p>No recent task updates</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Summary */}
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="bg-white rounded-lg border border-muted/20 p-6">
            <h3 className="text-lg font-semibold text-text mb-4">
              Progress Overview
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted">Overall Completion</span>
                  <span className="font-medium">
                    {state.stats.totalTasks > 0
                      ? Math.round(
                          (state.stats.completedTasks /
                            state.stats.totalTasks) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        state.stats.totalTasks > 0
                          ? (state.stats.completedTasks /
                              state.stats.totalTasks) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-muted/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted">Active Projects</span>
                  <span className="text-2xl font-bold text-primary">
                    {state.projects.filter((p) => p.status === "active").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Team Members</span>
                  <span className="text-2xl font-bold text-accent">
                    {state.stats.activeUsers}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white rounded-lg border border-muted/20 p-6">
            <h3 className="text-lg font-semibold text-text mb-4">
              Recent Activity
            </h3>

            <div className="space-y-3">
              {state.tasks
                .filter((task) => task.comments.length > 0)
                .sort((a, b) => {
                  const aLatest = Math.max(
                    ...a.comments.map((c) => new Date(c.createdAt).getTime())
                  );
                  const bLatest = Math.max(
                    ...b.comments.map((c) => new Date(c.createdAt).getTime())
                  );
                  return bLatest - aLatest;
                })
                .slice(0, 5)
                .map((task) => {
                  const latestComment = task.comments.sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )[0];

                  return (
                    <div
                      key={`${task.id}-${latestComment.id}`}
                      className="flex space-x-3"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {latestComment.authorName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text">
                          <span className="font-medium">
                            {latestComment.authorName}
                          </span>
                          {" commented on "}
                          <span className="font-medium">{task.title}</span>
                        </p>
                        <p className="text-xs text-muted mt-1 truncate">
                          {latestComment.content}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          {new Date(
                            latestComment.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}

              {state.tasks.filter((task) => task.comments.length > 0).length ===
                0 && (
                <p className="text-sm text-muted text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
