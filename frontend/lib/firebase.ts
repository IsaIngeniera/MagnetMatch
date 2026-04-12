// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCdonEMmnFyK9QVaxw-kUZFtVB9p2_BLsA",
  authDomain: "magnetmatch1.firebaseapp.com",
  projectId: "magnetmatch1",
  storageBucket: "magnetmatch1.firebasestorage.app",
  messagingSenderId: "466440480859",
  appId: "1:466440480859:web:9335458c89470c3f6f377e"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();