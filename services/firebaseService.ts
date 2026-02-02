
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
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    deleteDoc, 
    updateDoc,
    serverTimestamp,
    getDoc
} from "firebase/firestore";
import { Message, ChatSession } from "../types";

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
export const db = getFirestore(app);

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

// --- Firestore Chat Functions ---

const SESSIONS_COLLECTION = "sessions";
const MESSAGES_COLLECTION = "messages";

export const saveChatSession = async (userId: string, sessionId: string, title: string) => {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await setDoc(sessionRef, {
        id: sessionId,
        userId,
        title,
        updatedAt: Date.now()
    }, { merge: true });
};

export const updateChatSessionTime = async (sessionId: string) => {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(sessionRef, {
        updatedAt: Date.now()
    });
};

export const saveMessage = async (sessionId: string, message: Message) => {
    const messageRef = doc(db, SESSIONS_COLLECTION, sessionId, MESSAGES_COLLECTION, message.id);
    await setDoc(messageRef, {
        ...message,
        timestamp: message.timestamp || Date.now()
    });
};

export const getChatSessions = async (userId: string): Promise<ChatSession[]> => {
    const q = query(
        collection(db, SESSIONS_COLLECTION),
        where("userId", "==", userId),
        orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as ChatSession);
};

export const getChatMessages = async (sessionId: string): Promise<Message[]> => {
    const q = query(
        collection(db, SESSIONS_COLLECTION, sessionId, MESSAGES_COLLECTION),
        orderBy("timestamp", "asc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Message);
};

export const deleteChatSession = async (sessionId: string) => {
    // Note: In Firestore, deleting a document doesn't delete its subcollections.
    // In a real app, you'd need to delete all messages first.
    // For this demo, we'll just delete the session document.
    await deleteDoc(doc(db, SESSIONS_COLLECTION, sessionId));
};
