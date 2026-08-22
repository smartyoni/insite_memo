import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCpZ1iVrU_JwK10gEvi9FGderKYaffgMGg",
  authDomain: "data-library-5cf6c.firebaseapp.com",
  projectId: "data-library-5cf6c",
  storageBucket: "data-library-5cf6c.firebasestorage.app",
  messagingSenderId: "976961164680",
  appId: "1:976961164680:web:4aa7027e61f13425bc163d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
