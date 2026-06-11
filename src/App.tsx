import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BrandProvider, useBrand } from "./context/BrandContext";
import { StoreProvider } from "./context/StoreContext";
import Layout, { type Page } from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StaffDashboard from "./pages/StaffDashboard";
import Staff from "./pages/Staff";
import Products from "./pages/Products";
import Logistics from "./pages/Logistics";
import CRM from "./pages/CRM";
import Tasks from "./pages/Tasks";
import Chat from "./pages/Chat";
import Expenses from "./pages/Expenses";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import FollowUps from "./pages/FollowUps";
import SalesTracker from "./pages/SalesTracker";
import FirebaseProvider from "./context/FirebaseContext";

function AppContent() {
  const { user } = useAuth();
  const { brand } = useBrand();
  const isCEO = user?.role === "ceo";
  const [page, setPage] = useState<Page>("dashboard");

  useEffect(() => {
    if (user && !isCEO) {
      if (
        ["products", "staff", "analytics", "settings", "sales"].includes(page)
      ) {
        setPage("dashboard");
      }
    }
  }, [user, isCEO, page]);

  if (!user) return <Login />;

  const renderPage = () => {
    if (!isCEO) {
      switch (page) {
        case "dashboard":
          return <StaffDashboard />;
        case "crm":
          return <CRM />;
        case "tasks":
          return <Tasks />;
        case "chat":
          return <Chat />;
        case "logistics":
          return <Logistics />;
        case "expenses":
          return <Expenses />;
        case "followups":
          return <FollowUps />;
        default:
          return <StaffDashboard />;
      }
    }
    switch (page) {
      case "dashboard":
        return <Dashboard />;
      case "staff":
        return <Staff />;
      case "products":
        return <Products />;
      case "logistics":
        return <Logistics />;
      case "crm":
        return <CRM />;
      case "tasks":
        return <Tasks />;
      case "chat":
        return <Chat />;
      case "expenses":
        return <Expenses />;
      case "analytics":
        return <Analytics />;
      case "sales":
        return <SalesTracker />;
      case "settings":
        return <Settings />;
      case "followups":
        return <FollowUps />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={page} onPageChange={setPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <BrandProvider>
        <StoreProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </StoreProvider>
      </BrandProvider>
    </FirebaseProvider>
  );
}
