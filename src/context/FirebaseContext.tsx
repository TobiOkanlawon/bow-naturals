// SETTING UP FIREBASE HERE

// Import the functions you need from the SDKs you need
import type { FirebaseApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { createContext, useContext } from "react";
import { app } from "./firebase";

interface FirebaseContextType {
  app: FirebaseApp;
}

type Props = { children: React.ReactNode };

const FirebaseContext = createContext<FirebaseContextType>({ app });

const defaultValue = { app };

const FirebaseProvider: React.FC<Props> = ({ children }) => {
  return (
    <FirebaseContext.Provider value={defaultValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);

export default FirebaseProvider;
