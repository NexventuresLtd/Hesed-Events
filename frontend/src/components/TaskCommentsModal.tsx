import { useState, useEffect } from "react";
import { X, Send, MessageSquare } from "lucide-react";
import { apiService } from "../services/api";

interface Comment {
  id: number;
  content: string;
  author: number;
  author_name: string;
  author_role: string;
  created_at: string;
}

interface TaskCommentsModalProps {
  taskId: number;
  taskTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskCommentsModal({
  taskId,
  taskTitle,
  isOpen,
  onClose,
}: TaskCommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && taskId) {
      loadComments();
    }
  }, [isOpen, taskId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTaskComments(taskId);
      setComments(data);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await apiService.addTaskComment(taskId, newComment);
      setNewComment("");
      await loadComments();
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-muted/20">
          <div className="flex items-center space-x-3">
            <MessageSquare className="text-primary" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-text">Comments</h2>
              <p className="text-sm text-muted">{taskTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-muted/5 dark:bg-gray-700/30 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {comment.author_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-text">
                        {comment.author_name}
                      </div>
                      <div className="text-xs text-muted capitalize">
                        {comment.author_role}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted">
                    {formatDate(comment.created_at)}
                  </div>
                </div>
                <p className="text-text whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="p-6 border-t border-muted/20">
          <div className="flex space-x-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="flex-1 px-4 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-white dark:bg-gray-700 text-text"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 h-fit"
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
