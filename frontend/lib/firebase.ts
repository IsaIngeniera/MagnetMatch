// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCfMUnIPVbppsuKMo3VZOTEnO7_2mGOnG8",
  authDomain: "magnetmatch-b12cf.firebaseapp.com",
  projectId: "magnetmatch-b12cf",
  storageBucket: "magnetmatch-b12cf.firebasestorage.app",
  messagingSenderId: "933418738934",
  appId: "1:933418738934:web:ff471eb43567ac5f2638d7",
  measurementId: "G-E8YBQ4B2RG"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();