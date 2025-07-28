
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyDT3HNFtiPjwom4wRacRfK0NXz4ExjZwc4",
  authDomain: "book-ac105.firebaseapp.com",
  databaseURL: "https://book-ac105-default-rtdb.firebaseio.com",
  projectId: "book-ac105",
  storageBucket: "book-ac105.firebasestorage.app",
  messagingSenderId: "407933799582",
  appId: "1:407933799582:web:16ee7cfe4dd2807ba0ff8f",
  measurementId: "G-3MT0ZKYDGC"
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getDatabase(app);
