
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

// Helper function to remove undefined values which Firestore doesn't support
// This is critical for preventing "Function DocumentReference.set() called with invalid data" errors
const cleanData = (data: any): any => {
    if (Array.isArray(data)) {
        return data.map(cleanData);
    } else if (data !== null && typeof data === 'object') {
        return Object.entries(data).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = cleanData(value);
            }
            return acc;
        }, {} as any);
    }
    return data;
};

export const saveChatSession = async (userId: string, sessionId: string, title: string) => {
    try {
        const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
        const data = cleanData({
            id: sessionId,
            userId,
            title,
            updatedAt: Date.now()
        });
        await setDoc(sessionRef, data, { merge: true });
    } catch (e) {
        console.error("Error saving chat session:", e);
    }
};

export const updateChatSessionTime = async (sessionId: string) => {
    try {
        const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
        await updateDoc(sessionRef, {
            updatedAt: Date.now()
        });
    } catch (e) {
        console.error("Error updating session time:", e);
    }
};

export const saveMessage = async (sessionId: string, message: Message) => {
    try {
        const messageRef = doc(db, SESSIONS_COLLECTION, sessionId, MESSAGES_COLLECTION, message.id);
        const data = cleanData({
            ...message,
            timestamp: message.timestamp || Date.now()
        });
        await setDoc(messageRef, data);
    } catch (e) {
        console.error("Error saving message:", e);
    }
};

export const getChatSessions = async (userId: string): Promise<ChatSession[]> => {
    try {
        const q = query(
            collection(db, SESSIONS_COLLECTION),
            where("userId", "==", userId)
        );
        
        const querySnapshot = await getDocs(q);
        const sessions = querySnapshot.docs.map(doc => doc.data() as ChatSession);
        // Client-side sorting to avoid Firestore index requirements
        return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return [];
    }
};

export const getChatMessages = async (sessionId: string): Promise<Message[]> => {
    try {
        const q = query(
            collection(db, SESSIONS_COLLECTION, sessionId, MESSAGES_COLLECTION),
            orderBy("timestamp", "asc")
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as Message);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
};

export const deleteChatSession = async (sessionId: string) => {
    try {
        await deleteDoc(doc(db, SESSIONS_COLLECTION, sessionId));
    } catch (e) {
        console.error("Error deleting session:", e);
    }
};
