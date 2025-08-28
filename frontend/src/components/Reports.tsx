import { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Download,
  Calendar,
  TrendingUp,
  PieChart,
  BarChart3,
} from "lucide-react";

export function Reports() {
  const { state } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  // Calculate metrics
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate progress by institution
  const progressByInstitution = state.institutions.map((institution) => {
    const institutionTasks = state.tasks.filter(
      (task) => task.institutionId === institution.id
    );
    const institutionCompleted = institutionTasks.filter(
      (task) => task.status === "completed"
    ).length;
    const institutionRate =
      institutionTasks.length > 0
        ? Math.round((institutionCompleted / institutionTasks.length) * 100)
        : 0;

    return {
      ...institution,
      totalTasks: institutionTasks.length,
      completedTasks: institutionCompleted,
      completionRate: institutionRate,
    };
  });

  // Calculate trends (mock data for demonstration)
  const weeklyProgress = [
    { week: "Week 1", completed: 12, started: 15 },
    { week: "Week 2", completed: 18, started: 12 },
    { week: "Week 3", completed: 15, started: 20 },
    { week: "Week 4", completed: 22, started: 18 },
  ];

  const handleDownloadPDF = () => {
    // In a real application, this would generate and download a PDF
    alert(
      "PDF report will be generated and downloaded. This is a demo implementation."
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex items-center justify-between">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-text">Reports & Analytics</h1>
          <p className="text-muted mt-1">
            Comprehensive project insights and progress tracking
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <button
            onClick={handleDownloadPDF}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
          >
            <Download size={20} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-muted/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Total Tasks</p>
              <p className="text-3xl font-bold text-text">{totalTasks}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <BarChart3 size={24} className="text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp size={16} className="text-green-600 mr-1" />
            <span className="text-green-600">+12%</span>
            <span className="text-muted ml-1">from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-muted/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Completion Rate</p>
              <p className="text-3xl font-bold text-text">{completionRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <PieChart size={24} className="text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp size={16} className="text-green-600 mr-1" />
            <span className="text-green-600">+8%</span>
            <span className="text-muted ml-1">improvement</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-muted/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Active Projects</p>
              <p className="text-3xl font-bold text-text">
                {state.projects.filter((p) => p.status === "active").length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-blue-600">
              {state.stats.institutionsCount}
            </span>
            <span className="text-muted ml-1">institutions involved</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-muted/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Team Members</p>
              <p className="text-3xl font-bold text-text">
                {state.stats.activeUsers}
              </p>
            </div>
            <div className="p-3 bg-accent/10 rounded-lg">
              <TrendingUp size={24} className="text-accent" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-accent">85%</span>
            <span className="text-muted ml-1">engagement rate</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress by Institution */}
        <div className="bg-white rounded-lg border border-muted/20 p-6">
          <h2 className="text-xl font-semibold text-text mb-4">
            Progress by Institution
          </h2>

          <div className="space-y-4">
            {progressByInstitution.map((institution) => (
              <div key={institution.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-text">{institution.name}</p>
                    <p className="text-sm text-muted">
                      {institution.completedTasks} of {institution.totalTasks}{" "}
                      tasks completed
                    </p>
                  </div>
                  <span className="text-sm font-medium text-text">
                    {institution.completionRate}%
                  </span>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${institution.completionRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Progress Trend */}
        <div className="bg-white rounded-lg border border-muted/20 p-6">
          <h2 className="text-xl font-semibold text-text mb-4">
            Weekly Progress Trend
          </h2>

          <div className="space-y-4">
            {weeklyProgress.map((week, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/5 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-text">{week.week}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted mt-1">
                    <span>Completed: {week.completed}</span>
                    <span>Started: {week.started}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-primary">
                    {Math.round((week.completed / week.started) * 100)}%
                  </div>
                  <div className="text-xs text-muted">completion</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Project Summary */}
      <div className="bg-white rounded-lg border border-muted/20 p-6">
        <h2 className="text-xl font-semibold text-text mb-4">
          Project Summary
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted/20">
                <th className="text-left py-3 px-4 font-medium text-muted">
                  Project
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted">
                  Tasks
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted">
                  Progress
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {state.projects.map((project) => {
                const projectCompleted = project.tasks.filter(
                  (t) => t.status === "completed"
                ).length;
                const projectProgress =
                  project.tasks.length > 0
                    ? Math.round(
                        (projectCompleted / project.tasks.length) * 100
                      )
                    : 0;

                return (
                  <tr key={project.id} className="border-b border-muted/10">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-text">{project.title}</p>
                        <p className="text-sm text-muted truncate">
                          {project.description}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-text">{project.tasks.length}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-muted/20 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${projectProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-text">
                          {projectProgress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          project.status === "active"
                            ? "bg-green-100 text-green-600"
                            : project.status === "completed"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
