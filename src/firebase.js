import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // These are safe to expose in client-side code
  apiKey: "AIzaSyD6zho7jW6s41tbXwQZfBgfGnM1OptC_oE",
  authDomain: "parkour-reborn-958ae.firebaseapp.com",
  projectId: "parkour-reborn-958ae",
  storageBucket: "parkour-reborn-958ae.firebasestorage.app",
  messagingSenderId: "625252002377",
  appId: "1:625252002377:web:2524593af493a728a42d98"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;