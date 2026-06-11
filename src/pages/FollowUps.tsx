import { useState, useMemo } from "react";
import { useBrand } from "../context/BrandContext";
import { useStore } from "../context/StoreContext";
import { formatNaira, type Order } from "../data/store";
import {
  Calendar,
  Phone,
  MessageCircle,
  CheckCircle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  PhoneCall,
  PhoneOff,
  MessageSquare,
  Save,
} from "lucide-react";

type FollowUpFilter = "due" | "upcoming" | "contacted" | "all";

const followUpStatusConfig: Record<
  Order["followUpStatus"],
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    icon: <Clock size={12} />,
  },
  reached: {
    label: "Reached",
    color: "text-blue-700",
    bg: "bg-blue-50",
    icon: <PhoneCall size={12} />,
  },
  responded: {
    label: "Responded",
    color: "text-purple-700",
    bg: "bg-purple-50",
    icon: <MessageSquare size={12} />,
  },
  "good-feedback": {
    label: "Good Feedback",
    color: "text-green-700",
    bg: "bg-green-50",
    icon: <ThumbsUp size={12} />,
  },
  "bad-feedback": {
    label: "Bad Feedback",
    color: "text-red-700",
    bg: "bg-red-50",
    icon: <ThumbsDown size={12} />,
  },
  "no-answer": {
    label: "No Answer",
    color: "text-gray-600",
    bg: "bg-gray-100",
    icon: <PhoneOff size={12} />,
  },
};

export default function FollowUps() {
  const { brand } = useBrand();
  const { orders, updateOrder } = useStore();
  const today = new Date();

  const [filter, setFilter] = useState<FollowUpFilter>("due");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] =
    useState<Order["followUpStatus"]>("pending");
  const [editNotes, setEditNotes] = useState("");

  const followUpOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (o.orderStatus !== "delivered" || !o.followUpDate) return false;
        const fDate = new Date(o.followUpDate);
        if (filter === "due") {
          return fDate <= today && o.followUpStatus === "pending";
        } else if (filter === "upcoming") {
          const weekFromNow = new Date(today);
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return fDate > today && fDate <= weekFromNow;
        } else if (filter === "contacted") {
          return o.followUpStatus !== "pending";
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.followUpDate).getTime() -
          new Date(b.followUpDate).getTime(),
      );
  }, [orders, filter, today]);

  const stats = useMemo(() => {
    const delivered = orders.filter(
      (o) => o.orderStatus === "delivered" && o.followUpDate,
    );
    const due = delivered.filter(
      (o) =>
        new Date(o.followUpDate) <= today && o.followUpStatus === "pending",
    ).length;
    const upcoming = delivered.filter((o) => {
      const fDate = new Date(o.followUpDate);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return fDate > today && fDate <= weekFromNow;
    }).length;
    const contacted = delivered.filter(
      (o) => o.followUpStatus !== "pending",
    ).length;
    return { due, upcoming, contacted, total: delivered.length };
  }, [orders, today]);

  const openWhatsApp = (number: string, name: string) => {
    const cleanNumber = number.replace(/[^0-9]/g, "");
    const message = encodeURIComponent(
      `Hi ${name}, hope you're enjoying your purchase! We wanted to check in and see if everything is going well. Let us know if you need anything!`,
    );
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
  };

  const callCustomer = (number: string) =>
    window.open(`tel:${number}`, "_self");

  const getDaysText = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffDays = Math.ceil(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `In ${diffDays} days`;
  };

  const startFollowUp = (order: Order) => {
    setEditingId(order.id);
    setEditStatus(
      order.followUpStatus === "pending" ? "reached" : order.followUpStatus,
    );
    setEditNotes(order.followUpNotes || "");
  };

  const saveFollowUp = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    await updateOrder(orderId, {
      followUpStatus: editStatus,
      followUpNotes: editNotes,
      followUpContactedAt:
        order?.followUpContactedAt || new Date().toISOString().split("T")[0],
    });
    setEditingId(null);
  };

  const filterTabs: {
    key: FollowUpFilter;
    label: string;
    count: number;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: "due",
      label: "Due Now",
      count: stats.due,
      icon: <Clock size={18} />,
      color: "#EF4444",
    },
    {
      key: "upcoming",
      label: "Upcoming",
      count: stats.upcoming,
      icon: <Calendar size={18} />,
      color: "#F59E0B",
    },
    {
      key: "contacted",
      label: "Contacted",
      count: stats.contacted,
      icon: <PhoneCall size={18} />,
      color: "#3B82F6",
    },
    {
      key: "all",
      label: "All",
      count: stats.total,
      icon: <CheckCircle size={18} />,
      color: "#10B981",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {filterTabs.map((tab) => (
          <div
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`card p-4 text-center cursor-pointer hover:shadow-md transition-all ${filter === tab.key ? "ring-2" : ""}`}
            style={
              filter === tab.key
                ? {
                    borderColor: brand.primaryColor,
                    boxShadow: `0 0 0 2px ${brand.primaryColor}30`,
                  }
                : {}
            }
          >
            <div
              className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${filter === tab.key ? "text-white" : ""}`}
              style={
                filter === tab.key
                  ? { backgroundColor: brand.primaryColor }
                  : { backgroundColor: `${tab.color}15`, color: tab.color }
              }
            >
              {tab.icon}
            </div>
            <p className="text-2xl font-bold" style={{ color: tab.color }}>
              {tab.count}
            </p>
            <p className="text-xs text-gray-500">{tab.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Info */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          {filter === "due" && "⚠️ Follow-ups Due Now"}
          {filter === "upcoming" && "📅 Upcoming This Week"}
          {filter === "contacted" && "📞 Already Contacted"}
          {filter === "all" && "📋 All Delivered Orders"}
        </h3>
        <span className="text-xs text-gray-400">
          {followUpOrders.length} orders
        </span>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {followUpOrders.length === 0 ? (
          <div className="card p-8 text-center">
            <CheckCircle size={40} className="mx-auto text-green-400 mb-2" />
            <p className="text-gray-500 text-sm">
              {filter === "due"
                ? "No follow-ups due! 🎉"
                : filter === "upcoming"
                  ? "No upcoming follow-ups."
                  : filter === "contacted"
                    ? "No contacted follow-ups yet."
                    : "No delivered orders yet."}
            </p>
          </div>
        ) : (
          followUpOrders.map((order) => {
            const isDue = new Date(order.followUpDate) <= today;
            const statusConf = followUpStatusConfig[order.followUpStatus];
            const isExpanded = expandedId === order.id;
            const isEditing = editingId === order.id;

            return (
              <div
                key={order.id}
                className={`card overflow-hidden ${isDue && order.followUpStatus === "pending" ? "border-l-4 border-red-500" : ""}`}
              >
                <div className="p-4 flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: brand.primaryColor }}
                  >
                    <User size={18} />
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {order.customerName}
                      </h4>
                      <span
                        className={`badge text-[10px] ${isDue && order.followUpStatus === "pending" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}
                      >
                        {getDaysText(order.followUpDate)}
                      </span>
                      <span
                        className={`badge text-[10px] flex items-center gap-1 ${statusConf.bg} ${statusConf.color}`}
                      >
                        {statusConf.icon} {statusConf.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Order #{order.serialNumber} • {order.city}, {order.state}{" "}
                      • Delivered: {order.actualDeliveryDate}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.items.map((i) => i.productName).join(", ")} •{" "}
                      {formatNaira(order.totalAmount)}
                    </p>
                    {order.followUpNotes && !isExpanded && (
                      <p className="text-xs text-blue-600 mt-1 italic truncate">
                        💬 "{order.followUpNotes}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => callCustomer(order.phoneNumber)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                      title="Call"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      onClick={() =>
                        openWhatsApp(order.whatsappNumber, order.customerName)
                      }
                      className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                      title="WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </button>
                    <button
                      onClick={() =>
                        isEditing
                          ? saveFollowUp(order.id)
                          : startFollowUp(order)
                      }
                      className={`p-2 rounded-lg ${isEditing ? "text-white" : "text-amber-500 hover:bg-amber-50"}`}
                      style={
                        isEditing ? { backgroundColor: brand.primaryColor } : {}
                      }
                      title={isEditing ? "Save" : "Update Follow-up"}
                    >
                      {isEditing ? <Save size={16} /> : <PhoneCall size={16} />}
                    </button>
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : order.id)
                      }
                      className="text-gray-400"
                    >
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {(isExpanded || isEditing) && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="mt-3 bg-gray-50 rounded-lg p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase flex items-center gap-1">
                        <PhoneCall size={12} /> Follow-up Status
                      </h4>

                      {isEditing ? (
                        <>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Stage
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {(
                                Object.entries(followUpStatusConfig) as [
                                  Order["followUpStatus"],
                                  (typeof followUpStatusConfig)["pending"],
                                ][]
                              ).map(([key, conf]) => (
                                <button
                                  key={key}
                                  onClick={() => setEditStatus(key)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                    editStatus === key
                                      ? "border-current shadow-sm"
                                      : "border-transparent"
                                  } ${conf.bg} ${conf.color}`}
                                >
                                  {conf.icon} {conf.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Customer Response / Notes
                            </label>
                            <textarea
                              className="input-field text-sm"
                              rows={3}
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Write what the customer said, their feedback, or any important notes..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveFollowUp(order.id)}
                              className="btn-primary text-xs flex items-center gap-1"
                              style={{ backgroundColor: brand.primaryColor }}
                            >
                              <Save size={12} /> Save Follow-up
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn-secondary text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <span
                              className={`badge flex items-center gap-1 ${statusConf.bg} ${statusConf.color}`}
                            >
                              {statusConf.icon} {statusConf.label}
                            </span>
                            {order.followUpContactedAt && (
                              <span className="text-[10px] text-gray-400">
                                Contacted on {order.followUpContactedAt}
                              </span>
                            )}
                          </div>
                          {order.followUpNotes ? (
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <p className="text-[10px] text-gray-400 mb-1">
                                Customer Response / Notes:
                              </p>
                              <p className="text-sm text-gray-700">
                                {order.followUpNotes}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">
                              No notes recorded yet
                            </p>
                          )}
                          <button
                            onClick={() => startFollowUp(order)}
                            className="btn-secondary text-xs flex items-center gap-1"
                          >
                            <PhoneCall size={12} /> Update Follow-up
                          </button>
                        </>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-gray-400">Phone</p>
                        <button
                          onClick={() => callCustomer(order.phoneNumber)}
                          className="text-blue-600 flex items-center gap-1 hover:underline"
                        >
                          <Phone size={10} /> {order.phoneNumber}
                        </button>
                      </div>
                      <div>
                        <p className="text-gray-400">WhatsApp</p>
                        <button
                          onClick={() =>
                            openWhatsApp(
                              order.whatsappNumber,
                              order.customerName,
                            )
                          }
                          className="text-green-600 flex items-center gap-1 hover:underline"
                        >
                          <MessageCircle size={10} /> {order.whatsappNumber}
                        </button>
                      </div>
                      <div>
                        <p className="text-gray-400">Follow-up Date</p>
                        <p
                          className={`font-medium ${isDue ? "text-red-600" : "text-gray-700"}`}
                        >
                          {order.followUpDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Amount Paid</p>
                        <p className="text-gray-700">
                          {formatNaira(order.amountPaid)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
