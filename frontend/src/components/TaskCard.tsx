import type { Task } from "../types";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onDragStart?: (task: Task) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, onDragStart, isDragging }: TaskCardProps) {
  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "initial":
        return "text-gray-600 bg-gray-100";
      case "in_progress":
        return "text-blue-600 bg-blue-100";
      case "completed":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "initial":
        return AlertCircle;
      case "in_progress":
        return Clock;
      case "completed":
        return CheckCircle2;
      default:
        return AlertCircle;
    }
  };

  const StatusIcon = getStatusIcon(task.status);
  const latestComment =
    task.comments.length > 0
      ? task.comments.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      : null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        if (onDragStart) {
          onDragStart(task);
        }
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onClick}
      className={`bg-white border border-muted/20 rounded-lg p-4 hover:shadow-md transition-all ${
        onClick ? "cursor-pointer" : ""
      } ${isDragging ? "opacity-50 transform rotate-2" : ""} hover:scale-105`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-text mb-1">{task.title}</h3>
          <p className="text-sm text-muted">
            {task.institutionName} • {task.assigneeName}
          </p>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(
            task.status
          )}`}
        >
          <StatusIcon size={12} />
          <span className="capitalize">{task.status.replace("_", " ")}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted">Progress</span>
          <span className="font-medium text-text">{task.progress}%</span>
        </div>
        <div className="w-full bg-muted/20 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${task.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Latest Comment */}
      {latestComment && (
        <div className="mb-3 p-2 bg-muted/5 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <MessageSquare size={14} className="text-muted" />
            <span className="text-xs font-medium text-text">
              {latestComment.authorName}
            </span>
            <span className="text-xs text-muted">
              {new Date(latestComment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-muted line-clamp-2">
            {latestComment.content}
          </p>
        </div>
      )}

      {/* Evidence Count */}
      {task.evidence.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-muted">
          <FileText size={14} />
          <span>
            {task.evidence.length} file{task.evidence.length !== 1 ? "s" : ""}{" "}
            uploaded
          </span>
        </div>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <div className="mt-2 text-xs text-muted">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
