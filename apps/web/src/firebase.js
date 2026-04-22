import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCemGFjwQYq3yy8RwIpzLxW8w94pT6OUUc",
  authDomain: "chainhandler-5b292.firebaseapp.com",
  projectId: "chainhandler-5b292",
  storageBucket: "chainhandler-5b292.firebasestorage.app",
  messagingSenderId: "558261279032",
  appId: "1:558261279032:web:acd20bf196192d49c689cd",
  measurementId: "G-0XESK94KRT"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
