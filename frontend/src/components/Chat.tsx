import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { apiService } from "../services/api";
import { Send, Users, MessageCircle, Search } from "lucide-react";
import type { ChatMessage } from "../types";

export function Chat() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<"group" | "private">("group");
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock users for private chat (in real app, this would come from API)
  const availableUsers = [
    { id: "2", name: "Jane Smith", role: "supervisor", online: true },
    { id: "3", name: "Bob Wilson", role: "supervisor", online: false },
    { id: "4", name: "Alice Brown", role: "supervisor", online: true },
    { id: "5", name: "Tom Green", role: "employee", online: true },
    { id: "6", name: "Sarah Johnson", role: "employee", online: false },
  ].filter((user) => user.id !== state.user?.id);

  // Load chat messages on component mount
  useEffect(() => {
    loadMessages();
  }, [activeTab, selectedUser]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      let fetchedMessages;

      if (activeTab === "group") {
        // Load group messages (project-based)
        fetchedMessages = await apiService.getChatMessages();
      } else if (selectedUser) {
        // Load private messages with selected user
        fetchedMessages = await apiService.getChatMessages(
          undefined,
          parseInt(selectedUser)
        );
      }

      // Convert API messages to frontend format and add them to app context
      if (fetchedMessages) {
        const convertedMessages: ChatMessage[] = fetchedMessages.map(
          (msg: any) => ({
            id: msg.id.toString(),
            senderId: msg.sender.toString(),
            senderName: msg.sender_name || "Unknown User",
            senderRole: msg.sender_role || "employee",
            content: msg.message,
            timestamp: msg.timestamp,
            chatType: activeTab,
            recipientId:
              activeTab === "private" ? selectedUser || undefined : undefined,
          })
        );

        // Add each message individually since we don't have bulk actions
        convertedMessages.forEach((message) => {
          if (activeTab === "group") {
            dispatch({ type: "ADD_GROUP_MESSAGE", payload: message });
          } else {
            dispatch({ type: "ADD_PRIVATE_MESSAGE", payload: message });
          }
        });
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !state.user) return;

    try {
      setIsLoading(true);

      const messageData = {
        message: message.trim(),
        is_group_message: activeTab === "group",
        ...(activeTab === "private" &&
          selectedUser && {
            recipient: parseInt(selectedUser),
          }),
        ...(activeTab === "group" &&
          state.projects.length > 0 && {
            project: parseInt(state.projects[0].id),
          }),
      };

      const sentMessage = await apiService.sendChatMessage(messageData);

      // Convert API message to frontend format
      const newMessage: ChatMessage = {
        id: sentMessage.id.toString(),
        senderId: state.user.id,
        senderName: state.user.name,
        senderRole: state.user.role,
        content: sentMessage.message,
        timestamp: sentMessage.timestamp,
        chatType: activeTab,
        recipientId:
          activeTab === "private" ? selectedUser || undefined : undefined,
      };

      if (activeTab === "group") {
        dispatch({ type: "ADD_GROUP_MESSAGE", payload: newMessage });
      } else {
        dispatch({ type: "ADD_PRIVATE_MESSAGE", payload: newMessage });
      }

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const getPrivateMessages = () => {
    if (!selectedUser) return [];

    return state.privateMessages
      .filter(
        (msg) =>
          (msg.senderId === state.user?.id &&
            msg.recipientId === selectedUser) ||
          (msg.senderId === selectedUser && msg.recipientId === state.user?.id)
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  };

  const getGroupMessages = () => {
    return state.groupMessages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  const filteredUsers = availableUsers.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayMessages =
    activeTab === "group" ? getGroupMessages() : getPrivateMessages();

  return (
    <div className="h-[calc(100vh-180px)] flex">
      {/* Sidebar - User list for private chat */}
      {activeTab === "private" && (
        <div className="w-80 bg-white border-r border-muted/20 flex flex-col">
          <div className="p-4 border-b border-muted/20">
            <h3 className="font-semibold text-text mb-3">Contacts</h3>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-muted/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user.id)}
                className={`w-full p-4 text-left hover:bg-muted/5 transition-colors border-b border-muted/10 ${
                  selectedUser === user.id
                    ? "bg-primary/5 border-l-4 border-l-primary"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    {user.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text truncate">
                      {user.name}
                    </p>
                    <p className="text-sm text-muted capitalize">{user.role}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text">
                {activeTab === "group" ? "Group Chat" : "Private Messages"}
              </h1>
              <p className="text-muted">
                {activeTab === "group"
                  ? "Communicate with all team members"
                  : selectedUser
                  ? `Chat with ${
                      availableUsers.find((u) => u.id === selectedUser)?.name
                    }`
                  : "Select a user to start chatting"}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-muted/10 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("group")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === "group"
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted hover:text-text"
                }`}
              >
                <Users size={16} />
                <span>Group</span>
              </button>
              <button
                onClick={() => setActiveTab("private")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === "private"
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted hover:text-text"
                }`}
              >
                <MessageCircle size={16} />
                <span>Private</span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {displayMessages.length > 0 ? (
            displayMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.senderId === state.user?.id
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.senderId === state.user?.id
                      ? "bg-primary text-white"
                      : "bg-muted/10 text-text"
                  }`}
                >
                  {msg.senderId !== state.user?.id && (
                    <div className="text-xs font-medium mb-1 opacity-75">
                      {msg.senderName} • {msg.senderRole}
                    </div>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <div
                    className={`text-xs mt-1 ${
                      msg.senderId === state.user?.id
                        ? "text-white/75"
                        : "text-muted"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>
                  {activeTab === "group"
                    ? "No messages yet. Start the conversation!"
                    : !selectedUser
                    ? "Select a user to start chatting"
                    : "No messages yet with this user"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        {(activeTab === "group" || selectedUser) && (
          <div className="p-4 border-t border-muted/20">
            <div className="flex space-x-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={`Send a message${
                  activeTab === "private"
                    ? ` to ${
                        availableUsers.find((u) => u.id === selectedUser)?.name
                      }`
                    : " to the group"
                }...`}
                className="flex-1 px-4 py-2 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
