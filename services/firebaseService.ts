
import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInAnonymously, 
    signOut, 
    onAuthStateChanged,
    User
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAJSQQh6XBtJhEOB-nbFCsnas9lxF6MrEc",
  authDomain: "flag1msm.firebaseapp.com",
  projectId: "flag1msm",
  storageBucket: "flag1msm.firebasestorage.app",
  messagingSenderId: "103642904367",
  appId: "1:103642904367:web:16dd34a405cb15a62fd3da"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google login failed", error);
    throw error;
  }
};

export const loginAsGuest = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error("Guest login failed", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
