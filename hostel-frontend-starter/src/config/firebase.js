// Firebase Configuration for Sree Lakshmi Ladies Hostel
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyARytYNTnnzBsBXfHygeNVaKsb8S9Si0YI",
  authDomain: "srilakshmiladieshostel-daca8.firebaseapp.com",
  projectId: "srilakshmiladieshostel-daca8",
  storageBucket: "srilakshmiladieshostel-daca8.firebasestorage.app",
  messagingSenderId: "681210557169",
  appId: "1:681210557169:web:5c20d69891ef895cefef50",
  measurementId: "G-F72CPFRGFS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
export default firebaseConfig;
