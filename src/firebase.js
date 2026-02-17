// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmb9N3KhVDCGBHQKTsbcm_ORpogw555kU",
  authDomain: "hello-club-5670f.firebaseapp.com",
  projectId: "hello-club-5670f",
  storageBucket: "hello-club-5670f.firebasestorage.app",
  messagingSenderId: "889026070117",
  appId: "1:889026070117:web:1d810c44bf14c65c19a88c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export
export const db = getFirestore(app);