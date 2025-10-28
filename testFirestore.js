const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

(async () => {
  try {
    const ref = await db.collection("messages").add({
      username: "test",
      message: "hello world",
      timestamp: Date.now(),
    });
    console.log("✅ 成功写入 Firestore:", ref.id);
  } catch (err) {
    console.error("❌ Firestore 写入失败:", err);
  }
})();