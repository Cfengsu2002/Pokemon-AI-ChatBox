const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyAug6pfvZu5dAZiGz0-kCpLdNDdVeiE5SU",
  authDomain: "pokemonai-chat.firebaseapp.com",
  projectId: "pokemonai-chat",
  storageBucket: "pokemonai-chat.appspot.com",
  messagingSenderId: "970257489450",
  appId: "1:970257489450:web:daedba2c2dd0fb25b0ad53",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

(async () => {
  try {
    const docRef = await addDoc(collection(db, "messages"), {
      username: "test",
      message: "test message",
      timestamp: Date.now()
    });
    console.log("✅ Write success:", docRef.id);
  } catch (err) {
    console.error("❌ Write failed:", err.message);
  }
})();
