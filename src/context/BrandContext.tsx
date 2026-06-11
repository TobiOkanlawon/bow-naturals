import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/context/firebase";

export interface BrandSettings {
  name: string;
  tagline: string;
  logoUrl: string;
  logoEmoji: string;
  primaryColor: string;
  primaryDark: string;
  primaryLight: string;
  sidebarGradientFrom: string;
  sidebarGradientTo: string;
  accentColor: string;
  ceoName: string;
  ceoEmail: string;
  ceoPassword: string;
}

const defaultBrand: BrandSettings = {
  name: "Bow Naturals",
  tagline: "Sales & Inventory Management",
  logoUrl: "",
  logoEmoji: "🌿",
  primaryColor: "#4F46E5",
  primaryDark: "#4338CA",
  primaryLight: "#818CF8",
  sidebarGradientFrom: "#312E81",
  sidebarGradientTo: "#4F46E5",
  accentColor: "#10B981",
  ceoName: "Sarah Johnson",
  ceoEmail: "ceo@company.com",
  ceoPassword: "admin123",
};

const BRAND_DOC = doc(db, "settings", "brand");

interface BrandContextType {
  brand: BrandSettings;
  updateBrand: (updates: Partial<BrandSettings>) => Promise<void>;
  resetBrand: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType>({
  brand: defaultBrand,
  updateBrand: async () => {},
  resetBrand: async () => {},
});

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandSettings>(defaultBrand);

  useEffect(() => {
    // Seed brand doc if it doesn't exist yet
    async function seedBrand() {
      const snap = await getDoc(BRAND_DOC);
      if (!snap.exists()) {
        await setDoc(BRAND_DOC, defaultBrand);
      }
    }
    seedBrand();

    // Live listener
    const unsub = onSnapshot(BRAND_DOC, (snap) => {
      if (snap.exists()) {
        setBrand({ ...defaultBrand, ...(snap.data() as BrandSettings) });
      }
    });

    return unsub;
  }, []);

  const updateBrand = async (updates: Partial<BrandSettings>) => {
    // Optimistic local update so the UI feels instant
    setBrand((prev) => ({ ...prev, ...updates }));
    await setDoc(BRAND_DOC, { ...brand, ...updates });
  };

  const resetBrand = async () => {
    setBrand(defaultBrand);
    await setDoc(BRAND_DOC, defaultBrand);
  };

  return (
    <BrandContext.Provider value={{ brand, updateBrand, resetBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export const useBrand = () => useContext(BrandContext);
