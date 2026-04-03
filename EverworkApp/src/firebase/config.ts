import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for Everwork app
const firebaseConfig = {
  apiKey: "AIzaSyD9J9a1D0gF3lA1J9l0J9l0J9l0J9l0J9l0",
  authDomain: "ever-work-ee664.firebaseapp.com",
  projectId: "ever-work-ee664",
  storageBucket: "ever-work-ee664.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
