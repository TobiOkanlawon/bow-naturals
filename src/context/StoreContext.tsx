import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/context/firebase";
import type {
  StaffMember,
  Product,
  LogisticsCompany,
  Order,
  Task,
  ChatMessage,
  Expense,
} from "@/data/store";

// ─── Default seed data ────────────────────────────────────────────────────────
// Kept here so StoreContext is self-contained. Seeded once when Firestore
// collections are found to be empty.

const defaultStaff: StaffMember[] = [
  {
    id: "1",
    name: "Mike Chen",
    email: "mike@company.com",
    password: "staff123",
    role: "Sales Manager",
    department: "Sales",
    status: "active",
    joinDate: "2023-03-15",
    phone: "+234 801 234 5678",
    salary: 150000,
    permissions: { canAddEditInventory: true, canAddLogistics: false },
  },
  {
    id: "2",
    name: "Lisa Park",
    email: "lisa@company.com",
    password: "staff123",
    role: "Marketing Lead",
    department: "Marketing",
    status: "active",
    joinDate: "2023-06-01",
    phone: "+234 802 345 6789",
    salary: 120000,
    permissions: { canAddEditInventory: false, canAddLogistics: false },
  },
  {
    id: "3",
    name: "James Wilson",
    email: "james@company.com",
    password: "staff123",
    role: "Inventory Manager",
    department: "Operations",
    status: "active",
    joinDate: "2022-11-20",
    phone: "+234 803 456 7890",
    salary: 100000,
    permissions: { canAddEditInventory: true, canAddLogistics: true },
  },
  {
    id: "4",
    name: "Ana Rodriguez",
    email: "ana@company.com",
    password: "staff123",
    role: "Customer Support",
    department: "Support",
    status: "active",
    joinDate: "2024-01-10",
    phone: "+234 804 567 8901",
    salary: 80000,
    permissions: { canAddEditInventory: false, canAddLogistics: false },
  },
];

const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Organic Shea Butter",
    category: "Body Care",
    tiers: [
      { name: "Retail", costPrice: 3500, sellingPrice: 8500 },
      { name: "Wholesale", costPrice: 3500, sellingPrice: 6500 },
      { name: "DM/Group", costPrice: 3500, sellingPrice: 7000 },
      { name: "VIP", costPrice: 3500, sellingPrice: 6000 },
    ],
    totalStock: 150,
    status: "in-stock",
  },
  {
    id: "2",
    name: "Lavender Essential Oil",
    category: "Essential Oils",
    tiers: [
      { name: "Retail", costPrice: 2500, sellingPrice: 6500 },
      { name: "Wholesale", costPrice: 2500, sellingPrice: 5000 },
      { name: "DM/Group", costPrice: 2500, sellingPrice: 5500 },
    ],
    totalStock: 25,
    status: "in-stock",
  },
  {
    id: "3",
    name: "Tea Tree Face Wash",
    category: "Face Care",
    tiers: [
      { name: "Retail", costPrice: 1800, sellingPrice: 5500 },
      { name: "Wholesale", costPrice: 1800, sellingPrice: 4000 },
      { name: "DM/Group", costPrice: 1800, sellingPrice: 4500 },
    ],
    totalStock: 200,
    status: "in-stock",
  },
  {
    id: "4",
    name: "Coconut Hair Mask",
    category: "Hair Care",
    tiers: [
      { name: "Retail", costPrice: 2800, sellingPrice: 7500 },
      { name: "Wholesale", costPrice: 2800, sellingPrice: 5500 },
      { name: "DM/Group", costPrice: 2800, sellingPrice: 6000 },
    ],
    totalStock: 0,
    status: "out-of-stock",
  },
  {
    id: "5",
    name: "Rose Water Toner",
    category: "Face Care",
    tiers: [
      { name: "Retail", costPrice: 1500, sellingPrice: 4500 },
      { name: "Wholesale", costPrice: 1500, sellingPrice: 3200 },
      { name: "DM/Group", costPrice: 1500, sellingPrice: 3800 },
    ],
    totalStock: 180,
    status: "in-stock",
  },
  {
    id: "6",
    name: "Argan Oil Serum",
    category: "Hair Care",
    tiers: [
      { name: "Retail", costPrice: 4000, sellingPrice: 9500 },
      { name: "Wholesale", costPrice: 4000, sellingPrice: 7500 },
      { name: "DM/Group", costPrice: 4000, sellingPrice: 8000 },
      { name: "Distributor", costPrice: 4000, sellingPrice: 6500 },
    ],
    totalStock: 85,
    status: "in-stock",
  },
];

const defaultLogistics: LogisticsCompany[] = [
  {
    id: "1",
    name: "ABC Logistics",
    phone: "+234 801 111 2222",
    location: "Lagos - Ikeja",
    inventory: [
      { productId: "1", quantity: 50, minStock: 10 },
      { productId: "3", quantity: 80, minStock: 20 },
    ],
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    name: "FastShip Nigeria",
    phone: "+234 802 222 3333",
    location: "Abuja - Wuse",
    inventory: [
      { productId: "1", quantity: 30, minStock: 10 },
      { productId: "2", quantity: 15, minStock: 5 },
    ],
    createdAt: "2024-02-15",
  },
  {
    id: "3",
    name: "QuickDeliver",
    phone: "+234 803 333 4444",
    location: "Port Harcourt",
    inventory: [
      { productId: "5", quantity: 60, minStock: 15 },
      { productId: "6", quantity: 25, minStock: 10 },
    ],
    createdAt: "2024-03-01",
  },
];

const defaultOrders: Order[] = [
  {
    id: "1",
    serialNumber: 1,
    customerName: "Adaeze Okonkwo",
    phoneNumber: "+234 805 123 4567",
    whatsappNumber: "+234 805 123 4567",
    deliveryAddress: "15 Marina Road",
    city: "Lagos",
    state: "Lagos",
    items: [
      {
        productId: "1",
        productName: "Organic Shea Butter",
        quantity: 3,
        unitPrice: 8500,
        costPrice: 3500,
        tierName: "Retail",
      },
    ],
    dealType: "retail",
    orderDate: "2024-12-10",
    expectedDeliveryDate: "2024-12-15",
    orderStatus: "delivered",
    deliveryFee: 2000,
    logisticsCompanyId: "1",
    logisticsLocation: "Lagos - Ikeja",
    actualDeliveryDate: "2024-12-14",
    followUpDate: "2025-01-13",
    paymentStatus: "paid",
    amountPaid: 27500,
    totalAmount: 25500,
    totalCost: 10500,
    grossProfit: 13000,
    notes: "Repeat customer",
    createdBy: "Mike Chen",
    isReturnCustomer: false,
    previousOrderId: null,
    followUpStatus: "good-feedback",
    followUpNotes: "Loved the shea butter, wants to order more next month.",
    followUpContactedAt: "2025-01-14",
  },
  {
    id: "2",
    serialNumber: 2,
    customerName: "Adaeze Okonkwo",
    phoneNumber: "+234 805 123 4567",
    whatsappNumber: "+234 805 123 4567",
    deliveryAddress: "15 Marina Road",
    city: "Lagos",
    state: "Lagos",
    items: [
      {
        productId: "3",
        productName: "Tea Tree Face Wash",
        quantity: 2,
        unitPrice: 5500,
        costPrice: 1800,
        tierName: "Retail",
      },
    ],
    dealType: "retail",
    orderDate: "2025-01-05",
    expectedDeliveryDate: "2025-01-10",
    orderStatus: "pending",
    deliveryFee: 0,
    logisticsCompanyId: "",
    logisticsLocation: "",
    actualDeliveryDate: "",
    followUpDate: "",
    paymentStatus: "unpaid",
    amountPaid: 0,
    totalAmount: 11000,
    totalCost: 3600,
    grossProfit: 0,
    notes: "",
    createdBy: "Lisa Park",
    isReturnCustomer: true,
    previousOrderId: "1",
    followUpStatus: "pending",
    followUpNotes: "",
    followUpContactedAt: "",
  },
  {
    id: "3",
    serialNumber: 3,
    customerName: "Chukwuemeka Nwosu",
    phoneNumber: "+234 806 234 5678",
    whatsappNumber: "+234 806 234 5678",
    deliveryAddress: "42 Adeola Street",
    city: "Abuja",
    state: "FCT",
    items: [
      {
        productId: "3",
        productName: "Tea Tree Face Wash",
        quantity: 10,
        unitPrice: 4000,
        costPrice: 1800,
        tierName: "Wholesale",
      },
      {
        productId: "5",
        productName: "Rose Water Toner",
        quantity: 10,
        unitPrice: 3200,
        costPrice: 1500,
        tierName: "Wholesale",
      },
    ],
    dealType: "wholesale",
    orderDate: "2024-12-12",
    expectedDeliveryDate: "2024-12-18",
    orderStatus: "shipped",
    deliveryFee: 0,
    logisticsCompanyId: "",
    logisticsLocation: "",
    actualDeliveryDate: "",
    followUpDate: "",
    paymentStatus: "partial",
    amountPaid: 50000,
    totalAmount: 72000,
    totalCost: 33000,
    grossProfit: 0,
    notes: "Bulk order",
    createdBy: "Lisa Park",
    isReturnCustomer: false,
    previousOrderId: null,
    followUpStatus: "pending",
    followUpNotes: "",
    followUpContactedAt: "",
  },
  {
    id: "4",
    serialNumber: 4,
    customerName: "Ngozi Eze",
    phoneNumber: "+234 807 345 6789",
    whatsappNumber: "+234 807 345 6789",
    deliveryAddress: "8 GRA Road",
    city: "Enugu",
    state: "Enugu",
    items: [
      {
        productId: "6",
        productName: "Argan Oil Serum",
        quantity: 2,
        unitPrice: 8000,
        costPrice: 4000,
        tierName: "DM/Group",
      },
    ],
    dealType: "dm",
    orderDate: "2024-12-13",
    expectedDeliveryDate: "2024-12-20",
    orderStatus: "pending",
    deliveryFee: 0,
    logisticsCompanyId: "",
    logisticsLocation: "",
    actualDeliveryDate: "",
    followUpDate: "",
    paymentStatus: "unpaid",
    amountPaid: 0,
    totalAmount: 16000,
    totalCost: 8000,
    grossProfit: 0,
    notes: "From Instagram DM",
    createdBy: "Ana Rodriguez",
    isReturnCustomer: false,
    previousOrderId: null,
    followUpStatus: "pending",
    followUpNotes: "",
    followUpContactedAt: "",
  },
  {
    id: "5",
    serialNumber: 5,
    customerName: "Chukwuemeka Nwosu",
    phoneNumber: "+234 806 234 5678",
    whatsappNumber: "+234 806 234 5678",
    deliveryAddress: "42 Adeola Street",
    city: "Abuja",
    state: "FCT",
    items: [
      {
        productId: "1",
        productName: "Organic Shea Butter",
        quantity: 5,
        unitPrice: 6500,
        costPrice: 3500,
        tierName: "Wholesale",
      },
    ],
    dealType: "wholesale",
    orderDate: "2025-01-08",
    expectedDeliveryDate: "2025-01-14",
    orderStatus: "uncommitted",
    deliveryFee: 0,
    logisticsCompanyId: "",
    logisticsLocation: "",
    actualDeliveryDate: "",
    followUpDate: "",
    paymentStatus: "unpaid",
    amountPaid: 0,
    totalAmount: 32500,
    totalCost: 17500,
    grossProfit: 0,
    notes: "Return customer - checking prices",
    createdBy: "Mike Chen",
    isReturnCustomer: true,
    previousOrderId: "3",
    followUpStatus: "pending",
    followUpNotes: "",
    followUpContactedAt: "",
  },
];

const defaultTasks: Task[] = [
  {
    id: "1",
    title: "Update product catalog",
    description: "Add new spring collection items to the catalog",
    assignee: "Lisa Park",
    priority: "high",
    status: "in-progress",
    dueDate: "2024-12-20",
    createdAt: "2024-12-01",
  },
  {
    id: "2",
    title: "Restock Lavender Oil",
    description:
      "Contact supplier for emergency restock of lavender essential oil",
    assignee: "James Wilson",
    priority: "urgent",
    status: "todo",
    dueDate: "2024-12-15",
    createdAt: "2024-12-10",
  },
  {
    id: "3",
    title: "Follow up with wholesale clients",
    description: "Send follow-up email with pricing and samples",
    assignee: "Mike Chen",
    priority: "medium",
    status: "review",
    dueDate: "2024-12-18",
    createdAt: "2024-12-05",
  },
  {
    id: "4",
    title: "Monthly sales report",
    description: "Compile December sales numbers and trends",
    assignee: "Mike Chen",
    priority: "medium",
    status: "todo",
    dueDate: "2024-12-31",
    createdAt: "2024-12-10",
  },
];

const defaultMessages: ChatMessage[] = [
  {
    id: "1",
    sender: "Sarah Johnson",
    senderRole: "ceo",
    message: "Good morning team! Let's review our Q4 targets today.",
    timestamp: "2024-12-12T09:00:00",
    channel: "general",
    isDirectMessage: false,
  },
  {
    id: "2",
    sender: "Mike Chen",
    senderRole: "staff",
    message: "We're at 85% of target. Got a large wholesale order today!",
    timestamp: "2024-12-12T09:05:00",
    channel: "general",
    isDirectMessage: false,
  },
  {
    id: "3",
    sender: "Lisa Park",
    senderRole: "staff",
    message: "Holiday campaign is live and getting great engagement 🎉",
    timestamp: "2024-12-12T09:10:00",
    channel: "general",
    isDirectMessage: false,
  },
  {
    id: "4",
    sender: "James Wilson",
    senderRole: "staff",
    message:
      "Heads up - Lavender oil stock is critically low at Ikeja location.",
    timestamp: "2024-12-12T09:15:00",
    channel: "general",
    isDirectMessage: false,
  },
];

const defaultExpenses: Expense[] = [
  {
    id: "1",
    category: "Raw Materials",
    description: "Shea butter bulk purchase",
    amount: 450000,
    date: "2024-12-01",
    status: "approved",
    submittedBy: "James Wilson",
  },
  {
    id: "2",
    category: "Marketing",
    description: "Instagram ad campaign",
    amount: 75000,
    date: "2024-12-05",
    status: "approved",
    submittedBy: "Lisa Park",
  },
  {
    id: "3",
    category: "Logistics",
    description: "ABC Logistics monthly charges",
    amount: 45000,
    date: "2024-12-10",
    status: "approved",
    submittedBy: "Mike Chen",
  },
  {
    id: "4",
    category: "Equipment",
    description: "New packaging machine",
    amount: 280000,
    date: "2024-12-08",
    status: "pending",
    submittedBy: "James Wilson",
  },
  {
    id: "5",
    category: "Office",
    description: "Monthly office supplies",
    amount: 25000,
    date: "2024-12-03",
    status: "approved",
    submittedBy: "Ana Rodriguez",
  },
];

// ─── Seed helper ──────────────────────────────────────────────────────────────
// Writes all defaults into a collection using a batch, only if the collection
// is currently empty.

async function seedCollection<T extends { id: string }>(
  collectionName: string,
  defaults: T[],
): Promise<void> {
  const snap = await getDocs(collection(db, collectionName));
  if (!snap.empty) return; // already seeded
  const batch = writeBatch(db);
  defaults.forEach((item) => {
    batch.set(doc(db, collectionName, item.id), item);
  });
  await batch.commit();
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface StoreContextType {
  // Data
  staff: StaffMember[];
  products: Product[];
  logistics: LogisticsCompany[];
  orders: Order[];
  tasks: Task[];
  messages: ChatMessage[];
  expenses: Expense[];
  loading: boolean;

  // Staff
  setStaff: (data: StaffMember[]) => Promise<void>;
  addStaffMember: (member: StaffMember) => Promise<void>;
  updateStaffMember: (
    id: string,
    updates: Partial<StaffMember>,
  ) => Promise<void>;
  deleteStaffMember: (id: string) => Promise<void>;

  // Products
  setProducts: (data: Product[]) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Logistics
  setLogistics: (data: LogisticsCompany[]) => Promise<void>;
  addLogisticsCompany: (company: LogisticsCompany) => Promise<void>;
  updateLogisticsCompany: (
    id: string,
    updates: Partial<LogisticsCompany>,
  ) => Promise<void>;
  deleteLogisticsCompany: (id: string) => Promise<void>;

  // Orders
  setOrders: (data: Order[]) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;

  // Tasks
  setTasks: (data: Task[]) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Messages
  addMessage: (message: ChatMessage) => Promise<void>;

  // Expenses
  setExpenses: (data: Expense[]) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  const [staff, setStaffState] = useState<StaffMember[]>([]);
  const [products, setProductsState] = useState<Product[]>([]);
  const [logistics, setLogisticsState] = useState<LogisticsCompany[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [messages, setMessagesState] = useState<ChatMessage[]>([]);
  const [expenses, setExpensesState] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Seed defaults into Firestore on first load, then attach listeners
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Seed all collections in parallel if empty
      await Promise.all([
        seedCollection("staff", defaultStaff),
        seedCollection("products", defaultProducts),
        seedCollection("logistics", defaultLogistics),
        seedCollection("orders", defaultOrders),
        seedCollection("tasks", defaultTasks),
        seedCollection("messages", defaultMessages),
        seedCollection("expenses", defaultExpenses),
      ]);
      if (cancelled) return;
      setLoading(false);
    }

    init();

    // Real-time listeners — these fire immediately with current data and then
    // on every subsequent change.
    const unsubs = [
      onSnapshot(collection(db, "staff"), (snap) => {
        setStaffState(snap.docs.map((d) => d.data() as StaffMember));
      }),
      onSnapshot(collection(db, "products"), (snap) => {
        setProductsState(snap.docs.map((d) => d.data() as Product));
      }),
      onSnapshot(collection(db, "logistics"), (snap) => {
        setLogisticsState(snap.docs.map((d) => d.data() as LogisticsCompany));
      }),
      onSnapshot(
        query(collection(db, "orders"), orderBy("serialNumber")),
        (snap) => {
          setOrdersState(snap.docs.map((d) => d.data() as Order));
        },
      ),
      onSnapshot(collection(db, "tasks"), (snap) => {
        setTasksState(snap.docs.map((d) => d.data() as Task));
      }),
      onSnapshot(
        query(collection(db, "messages"), orderBy("timestamp")),
        (snap) => {
          setMessagesState(snap.docs.map((d) => d.data() as ChatMessage));
        },
      ),
      onSnapshot(collection(db, "expenses"), (snap) => {
        setExpensesState(snap.docs.map((d) => d.data() as Expense));
      }),
    ];

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }, []);

  // ─── Generic batch-replace (replaces all docs in a collection) ─────────────
  // Used when a page calls setOrders(entireArray) etc.
  // For perf-sensitive collections with many docs, prefer the granular
  // add/update/delete methods below instead.

  async function replaceCollection<T extends { id: string }>(
    collectionName: string,
    data: T[],
  ): Promise<void> {
    const snap = await getDocs(collection(db, collectionName));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    data.forEach((item) => batch.set(doc(db, collectionName, item.id), item));
    await batch.commit();
  }

  // ─── Staff ────────────────────────────────────────────────────────────────

  const setStaff = useCallback(
    (data: StaffMember[]) => replaceCollection("staff", data),
    [],
  );

  const addStaffMember = useCallback(async (member: StaffMember) => {
    await setDoc(doc(db, "staff", member.id), member);
  }, []);

  const updateStaffMember = useCallback(
    async (id: string, updates: Partial<StaffMember>) => {
      await updateDoc(doc(db, "staff", id), updates as Record<string, unknown>);
    },
    [],
  );

  const deleteStaffMember = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "staff", id));
  }, []);

  // ─── Products ─────────────────────────────────────────────────────────────

  const setProducts = useCallback(
    (data: Product[]) => replaceCollection("products", data),
    [],
  );

  const addProduct = useCallback(async (product: Product) => {
    await setDoc(doc(db, "products", product.id), product);
  }, []);

  const updateProduct = useCallback(
    async (id: string, updates: Partial<Product>) => {
      await updateDoc(
        doc(db, "products", id),
        updates as Record<string, unknown>,
      );
    },
    [],
  );

  const deleteProduct = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "products", id));
  }, []);

  // ─── Logistics ────────────────────────────────────────────────────────────

  const setLogistics = useCallback(
    (data: LogisticsCompany[]) => replaceCollection("logistics", data),
    [],
  );

  const addLogisticsCompany = useCallback(async (company: LogisticsCompany) => {
    await setDoc(doc(db, "logistics", company.id), company);
  }, []);

  const updateLogisticsCompany = useCallback(
    async (id: string, updates: Partial<LogisticsCompany>) => {
      await updateDoc(
        doc(db, "logistics", id),
        updates as Record<string, unknown>,
      );
    },
    [],
  );

  const deleteLogisticsCompany = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "logistics", id));
  }, []);

  // ─── Orders ───────────────────────────────────────────────────────────────

  const setOrders = useCallback(
    (data: Order[]) => replaceCollection("orders", data),
    [],
  );

  const addOrder = useCallback(async (order: Order) => {
    await setDoc(doc(db, "orders", order.id), order);
  }, []);

  const updateOrder = useCallback(
    async (id: string, updates: Partial<Order>) => {
      await updateDoc(
        doc(db, "orders", id),
        updates as Record<string, unknown>,
      );
    },
    [],
  );

  const deleteOrder = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "orders", id));
  }, []);

  // ─── Tasks ────────────────────────────────────────────────────────────────

  const setTasks = useCallback(
    (data: Task[]) => replaceCollection("tasks", data),
    [],
  );

  const addTask = useCallback(async (task: Task) => {
    await setDoc(doc(db, "tasks", task.id), task);
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    await updateDoc(doc(db, "tasks", id), updates as Record<string, unknown>);
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "tasks", id));
  }, []);

  // ─── Messages ─────────────────────────────────────────────────────────────

  const addMessage = useCallback(async (message: ChatMessage) => {
    await setDoc(doc(db, "messages", message.id), message);
  }, []);

  // ─── Expenses ─────────────────────────────────────────────────────────────

  const setExpenses = useCallback(
    (data: Expense[]) => replaceCollection("expenses", data),
    [],
  );

  const addExpense = useCallback(async (expense: Expense) => {
    await setDoc(doc(db, "expenses", expense.id), expense);
  }, []);

  const updateExpense = useCallback(
    async (id: string, updates: Partial<Expense>) => {
      await updateDoc(
        doc(db, "expenses", id),
        updates as Record<string, unknown>,
      );
    },
    [],
  );

  const deleteExpense = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "expenses", id));
  }, []);

  return (
    <StoreContext.Provider
      value={{
        staff,
        products,
        logistics,
        orders,
        tasks,
        messages,
        expenses,
        loading,
        setStaff,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        setProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        setLogistics,
        addLogisticsCompany,
        updateLogisticsCompany,
        deleteLogisticsCompany,
        setOrders,
        addOrder,
        updateOrder,
        deleteOrder,
        setTasks,
        addTask,
        updateTask,
        deleteTask,
        addMessage,
        setExpenses,
        addExpense,
        updateExpense,
        deleteExpense,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
