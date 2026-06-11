import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useBrand } from "../context/BrandContext";
import { useStore } from "../context/StoreContext";
import { type ChatMessage } from "../data/store";
import { Send, Hash, Users, User, MessageCircle } from "lucide-react";

export default function Chat() {
  const { user } = useAuth();
  const { brand } = useBrand();
  const { messages, staff, addMessage } = useStore();
  const [activeChannel, setActiveChannel] = useState("general");
  const [activeRecipient, setActiveRecipient] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const channels = [
    { id: "general", label: "General", icon: <Hash size={16} /> },
    { id: "sales", label: "Sales", icon: <Hash size={16} /> },
    { id: "support", label: "Support", icon: <Hash size={16} /> },
  ];

  const filteredMessages = useMemo(() => {
    if (activeRecipient) {
      return messages.filter(
        (m) =>
          m.isDirectMessage &&
          ((m.sender === user?.name && m.recipientId === activeRecipient) ||
            ((m.recipientId === user?.name || m.recipientName === user?.name) &&
              staff.find((s) => s.id === activeRecipient)?.name === m.sender)),
      );
    }
    if (activeChannel === "all-staff") {
      return messages.filter(
        (m) => !m.isDirectMessage && m.channel === "all-staff",
      );
    }
    return messages.filter(
      (m) => !m.isDirectMessage && m.channel === activeChannel,
    );
  }, [messages, activeChannel, activeRecipient, user, staff]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages.length]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: user.name,
      senderRole: user.role,
      message: input.trim(),
      timestamp: new Date().toISOString(),
      channel: activeRecipient ? "dm" : activeChannel,
      isDirectMessage: !!activeRecipient,
      recipientId: activeRecipient || undefined,
      recipientName: activeRecipient
        ? staff.find((s) => s.id === activeRecipient)?.name
        : undefined,
    };
    setInput("");
    await addMessage(newMsg);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getUnreadDMCount = (staffId: string) => {
    const staffMember = staff.find((s) => s.id === staffId);
    return messages.filter(
      (m) =>
        m.isDirectMessage &&
        m.sender === staffMember?.name &&
        (m.recipientId === user?.name || m.recipientName === user?.name),
    ).length;
  };

  return (
    <div className="card flex h-[calc(100vh-140px)] overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${showSidebar ? "block" : "hidden"} sm:block w-60 border-r border-gray-100 shrink-0 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle size={16} /> Messages
          </h3>
        </div>

        {/* Channels */}
        <div className="p-2">
          <p className="text-[10px] uppercase text-gray-400 font-semibold px-3 mb-1">
            Channels
          </p>
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => {
                setActiveChannel(ch.id);
                setActiveRecipient(null);
                setShowSidebar(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeChannel === ch.id && !activeRecipient
                  ? "text-white font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              style={
                activeChannel === ch.id && !activeRecipient
                  ? { backgroundColor: brand.primaryColor }
                  : {}
              }
            >
              {ch.icon}
              <span>{ch.label}</span>
            </button>
          ))}
          <button
            onClick={() => {
              setActiveChannel("all-staff");
              setActiveRecipient(null);
              setShowSidebar(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeChannel === "all-staff" && !activeRecipient
                ? "text-white font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            style={
              activeChannel === "all-staff" && !activeRecipient
                ? { backgroundColor: brand.primaryColor }
                : {}
            }
          >
            <Users size={16} />
            <span>All Staff</span>
          </button>
        </div>

        {/* Direct Messages */}
        <div className="p-2 flex-1 overflow-y-auto">
          <p className="text-[10px] uppercase text-gray-400 font-semibold px-3 mb-1">
            Direct Messages
          </p>
          {staff
            .filter((s) => s.name !== user?.name)
            .map((s) => {
              const unread = getUnreadDMCount(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveRecipient(s.id);
                    setActiveChannel("dm");
                    setShowSidebar(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeRecipient === s.id
                      ? "text-white font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  style={
                    activeRecipient === s.id
                      ? { backgroundColor: brand.primaryColor }
                      : {}
                  }
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-gray-400">
                    {s.name.charAt(0)}
                  </div>
                  <span className="flex-1 text-left truncate">{s.name}</span>
                  {unread > 0 && activeRecipient !== s.id && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="sm:hidden text-gray-400"
          >
            <Hash size={20} />
          </button>
          {activeRecipient ? (
            <>
              <User size={18} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">
                {staff.find((s) => s.id === activeRecipient)?.name}
              </h3>
              <span className="text-xs text-gray-400">Direct Message</span>
            </>
          ) : (
            <>
              {activeChannel === "all-staff" ? (
                <Users size={18} className="text-gray-400" />
              ) : (
                <Hash size={18} className="text-gray-400" />
              )}
              <h3 className="text-sm font-semibold text-gray-900 capitalize">
                {activeChannel === "all-staff" ? "All Staff" : activeChannel}
              </h3>
              <span className="text-xs text-gray-400">
                {filteredMessages.length} messages
              </span>
            </>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle size={40} className="mb-2" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.sender === user?.name;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{
                      backgroundColor:
                        msg.senderRole === "ceo"
                          ? brand.primaryColor
                          : "#6B7280",
                    }}
                  >
                    {msg.sender.charAt(0)}
                  </div>
                  <div className={`max-w-[70%] ${isMe ? "text-right" : ""}`}>
                    <div
                      className={`flex items-center gap-2 mb-0.5 ${isMe ? "flex-row-reverse" : ""}`}
                    >
                      <span className="text-xs font-semibold text-gray-700">
                        {isMe ? "You" : msg.sender}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <div
                      className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                        isMe
                          ? "text-white rounded-br-md"
                          : "bg-gray-100 text-gray-800 rounded-bl-md"
                      }`}
                      style={
                        isMe ? { backgroundColor: brand.primaryColor } : {}
                      }
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={
                activeRecipient
                  ? `Message ${staff.find((s) => s.id === activeRecipient)?.name}...`
                  : `Message #${activeChannel}...`
              }
              className="input-field flex-1"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="btn-primary px-4 disabled:opacity-50"
              style={{ backgroundColor: brand.primaryColor }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
