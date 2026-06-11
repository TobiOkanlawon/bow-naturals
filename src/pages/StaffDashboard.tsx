import { useMemo } from "react";
import { useBrand } from "../context/BrandContext";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import {
  CheckSquare,
  MessageSquare,
  Package,
  Clock,
  Calendar,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

export default function StaffDashboard() {
  const { user } = useAuth();
  const { brand } = useBrand();
  const { tasks, messages, orders } = useStore();

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assignee === user?.name),
    [tasks, user],
  );
  const pendingTasks = myTasks.filter((t) => t.status !== "done");
  const recentMessages = messages
    .filter((m) => !m.isDirectMessage)
    .slice(-5)
    .reverse();

  const orderStats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.orderStatus === "pending").length;
    const confirmed = orders.filter(
      (o) => o.orderStatus === "confirmed",
    ).length;
    const shipped = orders.filter((o) => o.orderStatus === "shipped").length;
    const delivered = orders.filter(
      (o) => o.orderStatus === "delivered",
    ).length;

    const today = new Date();
    const dueFollowUps = orders.filter((o) => {
      if (!o.followUpDate) return false;
      const fDate = new Date(o.followUpDate);
      return fDate <= today && o.orderStatus === "delivered";
    });

    return { total, pending, confirmed, shipped, delivered, dueFollowUps };
  }, [orders]);

  const stats = [
    {
      label: "Total Orders",
      value: orderStats.total,
      icon: <ShoppingCart size={20} />,
      color: brand.primaryColor,
    },
    {
      label: "Pending",
      value: orderStats.pending,
      icon: <Clock size={20} />,
      color: "#F59E0B",
    },
    {
      label: "Shipped",
      value: orderStats.shipped,
      icon: <Package size={20} />,
      color: "#3B82F6",
    },
    {
      label: "Delivered",
      value: orderStats.delivered,
      icon: <TrendingUp size={20} />,
      color: "#10B981",
    },
    {
      label: "My Tasks",
      value: myTasks.length,
      icon: <CheckSquare size={20} />,
      color: "#8B5CF6",
    },
    {
      label: "Due Follow-ups",
      value: orderStats.dueFollowUps.length,
      icon: <Calendar size={20} />,
      color: "#EF4444",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Welcome back, {user?.name}! 👋
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Here's your overview for today.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: stat.color }}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-[10px] text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Pending Tasks */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            My Pending Tasks
          </h3>
          {pendingTasks.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              All caught up! 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {pendingTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                  </div>
                  <span
                    className={`badge ${
                      task.priority === "urgent"
                        ? "bg-red-50 text-red-700"
                        : task.priority === "high"
                          ? "bg-orange-50 text-orange-700"
                          : task.priority === "medium"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Due Follow-ups */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-red-500" />
            <h3 className="text-base font-semibold text-gray-900">
              Due for Follow-up
            </h3>
          </div>
          {orderStats.dueFollowUps.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No follow-ups due! ✅
            </p>
          ) : (
            <div className="space-y-3">
              {orderStats.dueFollowUps.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{order.serialNumber} - {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Delivered: {order.actualDeliveryDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-red-600 font-medium">
                      Follow-up: {order.followUpDate}
                    </p>
                    <a
                      href={`https://wa.me/${order.whatsappNumber.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:underline"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Messages */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={18} className="text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900">
              Recent Team Messages
            </h3>
          </div>
          <div className="space-y-3">
            {recentMessages.map((msg) => (
              <div
                key={msg.id}
                className="flex gap-3 py-2 border-b border-gray-50 last:border-0"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{
                    backgroundColor:
                      msg.senderRole === "ceo" ? brand.primaryColor : "#6B7280",
                  }}
                >
                  {msg.sender.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-gray-700">
                      {msg.sender}
                    </p>
                    <span className="text-[10px] text-gray-400">
                      #{msg.channel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {msg.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
