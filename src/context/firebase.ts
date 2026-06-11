import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCJAnuM-N5SHhXewKlc8vc44zlCo3y2VBw",
  authDomain: "bow-naturals.firebaseapp.com",
  projectId: "bow-naturals",
  storageBucket: "bow-naturals.firebasestorage.app",
  messagingSenderId: "926908748051",
  appId: "1:926908748051:web:51682f065ec55aea678ae6",
  measurementId: "G-G03G954MQM",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app);
// const analytics = getAnalytics(app);
