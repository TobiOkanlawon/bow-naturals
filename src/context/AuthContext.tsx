import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ceo' | 'staff';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
});

const FIRESTORE_PATHS = {
  BRAND_DOC: 'brand',
  BRAND_COLLECTION: 'settings',
  STAFF_COLLECTION: 'staff',
  EMAIL_FIELD: 'email',
} as const;

async function resolveUserProfile(
  uid: string,
  email: string,
  fallbackName: string
): Promise<User> {
  const normalizedEmail = email.toLowerCase();

  try {
    const [brandSnap, staffSnap] = await Promise.all([
      getDoc(doc(db, FIRESTORE_PATHS.BRAND_COLLECTION, FIRESTORE_PATHS.BRAND_DOC)),
      getDocs(query(
        collection(db, FIRESTORE_PATHS.STAFF_COLLECTION),
        where(FIRESTORE_PATHS.EMAIL_FIELD, '==', email)
      )),
    ]);

    if (brandSnap.exists()) {
      const brand = brandSnap.data();
      if (brand.ceoEmail && brand.ceoEmail.toLowerCase() === normalizedEmail) {
        return {
          id: uid,
          name: brand.ceoName || fallbackName,
          email,
          role: 'ceo',
        };
      }
    }

    if (!staffSnap.empty) {
      const staffDoc = staffSnap.docs[0].data();
      return {
        id: uid,
        name: staffDoc.name || fallbackName,
        email,
        role: 'staff',
      };
    }
  } catch (error) {
    console.error('Error resolving user profile:', error);
  }

  return {
    id: uid,
    name: fallbackName,
    email,
    role: 'staff',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const fallbackName =
        firebaseUser.displayName ??
        firebaseUser.email?.split('@')[0] ??
        'User';

      const resolved = await resolveUserProfile(
        firebaseUser.uid,
        firebaseUser.email ?? '',
        fallbackName
      );

      setUser(resolved);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let errorMsg = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'Email not found';
      } else if (error.code === 'auth/wrong-password') {
        errorMsg = 'Wrong password';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email';
      } else if (error.code === 'auth/user-disabled') {
        errorMsg = 'Account disabled';
      }
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);