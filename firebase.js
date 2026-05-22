const { initializeApp } = require("firebase/app");

const {
  getFirestore,
  doc,
  onSnapshot
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCO3VDNkgPXqBR3mDSeWZucuptY7pzPGGM",
  authDomain: "pc-timer.firebaseapp.com",
  projectId: "pc-timer",
  storageBucket: "pc-timer.firebasestorage.app",
  messagingSenderId: "950166819470",
  appId: "1:950166819470:web:cfe6974fac1b644d60efdf"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

module.exports = {
  db,
  doc,
  onSnapshot
};