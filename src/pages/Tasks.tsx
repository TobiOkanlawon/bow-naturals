import { useState } from "react";
import { useBrand } from "../context/BrandContext";
import { useStore } from "../context/StoreContext";
import { type Task } from "../data/store";
import { Plus, X, GripVertical } from "lucide-react";

const columns: { key: Task["status"]; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "#6B7280" },
  { key: "in-progress", label: "In Progress", color: "#3B82F6" },
  { key: "review", label: "Review", color: "#F59E0B" },
  { key: "done", label: "Done", color: "#10B981" },
];

const priorityColors: Record<Task["priority"], string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700",
};

export default function Tasks() {
  const { brand } = useBrand();
  const { tasks, addTask, updateTask, deleteTask } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<Task>>({});

  const openAdd = (status: Task["status"] = "todo") => {
    setForm({
      status,
      priority: "medium",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      createdAt: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: form.title || "",
      description: form.description || "",
      assignee: form.assignee || "",
      priority: (form.priority as Task["priority"]) || "medium",
      status: (form.status as Task["status"]) || "todo",
      dueDate: form.dueDate || "",
      createdAt: form.createdAt || new Date().toISOString().split("T")[0],
    };
    await addTask(newTask);
    setShowModal(false);
  };

  const moveTask = async (taskId: string, newStatus: Task["status"]) => {
    await updateTask(taskId, { status: newStatus });
  };

  const removeTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {tasks.length} total tasks,{" "}
          {tasks.filter((t) => t.status === "done").length} completed
        </p>
        <button
          onClick={() => openAdd()}
          className="btn-primary flex items-center gap-2"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="bg-gray-100/80 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  <h3 className="text-sm font-semibold text-gray-700">
                    {col.label}
                  </h3>
                  <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => openAdd(col.key)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical size={14} className="text-gray-300" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`badge text-[10px] ${priorityColors[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {task.dueDate}
                      </span>
                    </div>
                    {task.assignee && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50">
                        <div
                          className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                          style={{ backgroundColor: brand.primaryColor }}
                        >
                          {task.assignee.charAt(0)}
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {task.assignee}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-1 mt-2 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      {columns
                        .filter((c) => c.key !== col.key)
                        .map((c) => (
                          <button
                            key={c.key}
                            onClick={() => moveTask(task.id, c.key)}
                            className="flex-1 text-[9px] py-1 rounded text-gray-500 hover:bg-gray-50 truncate"
                          >
                            → {c.label}
                          </button>
                        ))}
                      <button
                        onClick={() => removeTask(task.id)}
                        className="text-[9px] py-1 px-2 rounded text-red-400 hover:bg-red-50"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-900">New Task</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  className="input-field"
                  value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <input
                    className="input-field"
                    value={form.assignee || ""}
                    onChange={(e) =>
                      setForm({ ...form, assignee: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.dueDate || ""}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    className="input-field"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value as Task["priority"],
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="input-field"
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as Task["status"],
                      })
                    }
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="btn-primary flex-1"
                style={{ backgroundColor: brand.primaryColor }}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
