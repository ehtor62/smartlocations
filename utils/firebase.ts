import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyA5anEMtEGR5kZtpoujp_Kz9HDQa3vXkN4",
  authDomain: "smartlocations-d5dea.firebaseapp.com",
  projectId: "smartlocations-d5dea",
  storageBucket: "smartlocations-d5dea.appspot.com",
  messagingSenderId: "381398666624",
  appId: "1:381398666624:web:fefff170c13bac9b428565"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export default app;