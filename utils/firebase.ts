import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA5anEMtEGR5kZtpoujp_Kz9HDQa3vXkN4",
  authDomain: "smartlocations-d5dea.firebaseapp.com",
  projectId: "smartlocations-d5dea",
  storageBucket: "smartlocations-d5dea.appspot.com",
  messagingSenderId: "381398666624",
  appId: "1:381398666624:web:fefff170c13bac9b428565"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Enable network for Firestore to ensure it's not in offline mode
if (typeof window !== 'undefined') {
  enableNetwork(db).catch((error) => {
    console.warn('Failed to enable Firestore network:', error);
  });
}

export default app;