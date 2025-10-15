import { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { apiService } from "../services/api";
import type { DailySummary as DailySummaryType } from "../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function DailySummary() {
  const [summary, setSummary] = useState<DailySummaryType | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary(selectedDate);
  }, [selectedDate]);

  const loadSummary = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);

      const dateStr = date.toISOString().split("T")[0];
      const data = await apiService.getDailySummary(dateStr);
      setSummary(data);
    } catch (err) {
      console.error("Error loading summary:", err);
      setError("Failed to load daily summary");
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDownloadPDF = () => {
    if (!summary) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header with logo/title
      doc.setFillColor(151, 170, 26); // Primary color
      doc.rect(0, 0, pageWidth, 35, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, "bold");
      doc.text("Hesed Events", 14, 15);

      doc.setFontSize(14);
      doc.setFont(undefined, "normal");
      doc.text("Daily Summary Report", 14, 24);

      doc.setFontSize(11);
      doc.text(formatDate(selectedDate), 14, 31);

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Summary Statistics
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text("Daily Statistics", 14, 45);

      const stats = [
        ["Category", "Count"],
        ["Tasks Created", summary.tasks_created.count.toString()],
        ["Tasks Completed", summary.tasks_completed.count.toString()],
        ["Tasks Updated", summary.tasks_updated.count.toString()],
        ["Projects Created", summary.projects_created.count.toString()],
        ["Overdue Tasks", summary.overdue_tasks.count.toString()],
      ];

      autoTable(doc, {
        startY: 50,
        head: [stats[0]],
        body: stats.slice(1),
        theme: "grid",
        headStyles: { fillColor: [151, 170, 26], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
      });

      let currentY = (doc as any).lastAutoTable.finalY + 10;

      // New Tasks
      if (summary.tasks_created.items.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text("New Tasks Created", 14, currentY);

        const tasksCreated = [
          ["Task", "Project", "Assignee", "Status"],
          ...summary.tasks_created.items.map((task) => [
            task.title.substring(0, 30) + (task.title.length > 30 ? "..." : ""),
            task.project.substring(0, 25) +
              (task.project.length > 25 ? "..." : ""),
            task.assignee.substring(0, 20),
            task.status,
          ]),
        ];

        autoTable(doc, {
          startY: currentY + 5,
          head: [tasksCreated[0]],
          body: tasksCreated.slice(1),
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // Completed Tasks
      if (summary.tasks_completed.items.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text("Tasks Completed", 14, currentY);

        const tasksCompleted = [
          ["Task", "Project", "Assignee", "Completed At"],
          ...summary.tasks_completed.items.map((task) => [
            task.title.substring(0, 30) + (task.title.length > 30 ? "..." : ""),
            task.project.substring(0, 25) +
              (task.project.length > 25 ? "..." : ""),
            task.assignee.substring(0, 20),
            new Date(task.completed_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          ]),
        ];

        autoTable(doc, {
          startY: currentY + 5,
          head: [tasksCompleted[0]],
          body: tasksCompleted.slice(1),
          theme: "striped",
          headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Add new page if needed
      if (currentY > 250 || summary.overdue_tasks.items.length > 0) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        // Overdue Tasks
        if (summary.overdue_tasks.items.length > 0) {
          doc.setFontSize(14);
          doc.setFont(undefined, "bold");
          doc.text("Overdue Tasks", 14, currentY);

          const overdueTasks = [
            ["Task", "Project", "Assignee", "Due Date"],
            ...summary.overdue_tasks.items.map((task) => [
              task.title.substring(0, 30) +
                (task.title.length > 30 ? "..." : ""),
              task.project.substring(0, 25) +
                (task.project.length > 25 ? "..." : ""),
              task.assignee.substring(0, 20),
              task.due_date
                ? new Date(task.due_date).toLocaleDateString()
                : "N/A",
            ]),
          ];

          autoTable(doc, {
            startY: currentY + 5,
            head: [overdueTasks[0]],
            body: overdueTasks.slice(1),
            theme: "striped",
            headStyles: {
              fillColor: [239, 68, 68],
              textColor: [255, 255, 255],
            },
            styles: { fontSize: 9 },
            margin: { left: 14, right: 14 },
          });
        }
      }

      // Projects Created
      if (summary.projects_created.items.length > 0) {
        doc.addPage();

        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text("New Projects", 14, 20);

        const projectsCreated = [
          ["Project", "Created By", "Status"],
          ...summary.projects_created.items.map((project) => [
            project.title.substring(0, 40) +
              (project.title.length > 40 ? "..." : ""),
            project.created_by.substring(0, 30),
            project.status,
          ]),
        ];

        autoTable(doc, {
          startY: 25,
          head: [projectsCreated[0]],
          body: projectsCreated.slice(1),
          theme: "striped",
          headStyles: { fillColor: [147, 51, 234], textColor: [255, 255, 255] },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
        doc.text(
          "© Hesed Events Management System",
          14,
          doc.internal.pageSize.getHeight() - 10
        );
      }

      // Save the PDF
      doc.save(`daily_summary_${selectedDate.toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF report. Please try again.");
    }
  };

  if (loading && !summary) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">Daily Summary</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted">Loading summary...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">Daily Summary</h1>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => loadSummary(selectedDate)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Daily Summary</h1>
          <p className="text-muted">Overview of activities and progress</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 bg-white dark:bg-gray-800 border border-muted/20 rounded-lg hover:bg-muted/5 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-muted/20 rounded-lg">
            <Calendar size={18} className="text-primary" />
            <span className="font-medium text-text whitespace-nowrap">
              {formatDate(selectedDate)}
            </span>
          </div>
          <button
            onClick={() => changeDate(1)}
            disabled={isToday(selectedDate)}
            className="p-2 bg-white dark:bg-gray-800 border border-muted/20 rounded-lg hover:bg-muted/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
          {!isToday(selectedDate) && (
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={handleDownloadPDF}
            disabled={!summary}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download PDF Report"
          >
            <Download size={18} />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {summary && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted/20">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="text-blue-600" size={24} />
                <span className="text-2xl font-bold text-text">
                  {summary.tasks_created.count}
                </span>
              </div>
              <p className="text-sm text-muted">Tasks Created</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted/20">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="text-green-600" size={24} />
                <span className="text-2xl font-bold text-text">
                  {summary.tasks_completed.count}
                </span>
              </div>
              <p className="text-sm text-muted">Tasks Completed</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted/20">
              <div className="flex items-center justify-between mb-2">
                <Clock className="text-yellow-600" size={24} />
                <span className="text-2xl font-bold text-text">
                  {summary.tasks_updated.count}
                </span>
              </div>
              <p className="text-sm text-muted">Tasks Updated</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted/20">
              <div className="flex items-center justify-between mb-2">
                <FolderPlus className="text-purple-600" size={24} />
                <span className="text-2xl font-bold text-text">
                  {summary.projects_created.count}
                </span>
              </div>
              <p className="text-sm text-muted">Projects Created</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-muted/20">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="text-red-600" size={24} />
                <span className="text-2xl font-bold text-text">
                  {summary.overdue_tasks.count}
                </span>
              </div>
              <p className="text-sm text-muted">Overdue Tasks</p>
            </div>
          </div>

          {/* Details Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks Created */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-muted/20 p-6">
              <h3 className="text-lg font-semibold text-text mb-4 flex items-center space-x-2">
                <TrendingUp size={20} className="text-blue-600" />
                <span>New Tasks</span>
              </h3>
              {summary.tasks_created.items.length === 0 ? (
                <p className="text-muted text-center py-8">
                  No tasks created on this day
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.tasks_created.items.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-muted/5 dark:bg-gray-700/30 rounded-lg"
                    >
                      <h4 className="font-medium text-text">{task.title}</h4>
                      <div className="text-sm text-muted mt-1">
                        {task.project} • {task.assignee}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tasks Completed */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-muted/20 p-6">
              <h3 className="text-lg font-semibold text-text mb-4 flex items-center space-x-2">
                <CheckCircle size={20} className="text-green-600" />
                <span>Completed Tasks</span>
              </h3>
              {summary.tasks_completed.items.length === 0 ? (
                <p className="text-muted text-center py-8">
                  No tasks completed on this day
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.tasks_completed.items.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-muted/5 dark:bg-gray-700/30 rounded-lg"
                    >
                      <h4 className="font-medium text-text">{task.title}</h4>
                      <div className="text-sm text-muted mt-1">
                        {task.project} • {task.assignee}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tasks Updated */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-muted/20 p-6">
              <h3 className="text-lg font-semibold text-text mb-4 flex items-center space-x-2">
                <Clock size={20} className="text-yellow-600" />
                <span>Updated Tasks</span>
              </h3>
              {summary.tasks_updated.items.length === 0 ? (
                <p className="text-muted text-center py-8">
                  No tasks updated on this day
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.tasks_updated.items.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-muted/5 dark:bg-gray-700/30 rounded-lg"
                    >
                      <h4 className="font-medium text-text">{task.title}</h4>
                      <div className="text-sm text-muted mt-1">
                        {task.project} • {task.assignee} • {task.progress}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-muted/20 p-6">
              <h3 className="text-lg font-semibold text-text mb-4 flex items-center space-x-2">
                <AlertTriangle size={20} className="text-red-600" />
                <span>Overdue Tasks</span>
              </h3>
              {summary.overdue_tasks.items.length === 0 ? (
                <p className="text-muted text-center py-8">No overdue tasks</p>
              ) : (
                <div className="space-y-3">
                  {summary.overdue_tasks.items.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <h4 className="font-medium text-text">{task.title}</h4>
                      <div className="text-sm text-muted mt-1">
                        {task.project} • {task.assignee} • Due: {task.due_date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Projects Created */}
          {summary.projects_created.items.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-muted/20 p-6">
              <h3 className="text-lg font-semibold text-text mb-4 flex items-center space-x-2">
                <FolderPlus size={20} className="text-purple-600" />
                <span>New Projects</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.projects_created.items.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 bg-muted/5 dark:bg-gray-700/30 rounded-lg"
                  >
                    <h4 className="font-medium text-text">{project.title}</h4>
                    <div className="text-sm text-muted mt-1">
                      Created by {project.created_by}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
