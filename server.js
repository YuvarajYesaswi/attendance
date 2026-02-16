const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.use(bodyParser.json());
app.use(express.static("."));

/* ---------- SIGN UP ---------- */
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const userRef = db.collection("users");
  const existing = await userRef.where("email", "==", email).get();

  if (!existing.empty)
    return res.send("Email already exists");

  const hash = await bcrypt.hash(password, 10);

  await userRef.add({ email, password: hash });

  res.send("User registered");
});

/* ---------- LOGIN ---------- */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const snap = await db.collection("users")
    .where("email", "==", email).get();

  if (snap.empty) return res.send("User not found");

  const user = snap.docs[0].data();

  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.send("Wrong password");

  res.send("Login success");
});

/* ---------- SAVE ATTENDANCE (7 PERIODS) ---------- */
app.post("/attendance", async (req, res) => {
  try {
    const attendanceData = req.body;

    // Clear old collection and save new data
    const oldDocs = await db.collection("attendance").get();
    const batch = db.batch();

    oldDocs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Add new attendance records
    for (const [studentName, record] of Object.entries(attendanceData)) {
      batch.set(db.collection("attendance").doc(studentName), {
        studentName,
        ...record
      });
    }

    await batch.commit();
    res.send("Attendance saved successfully");
  } catch (error) {
    console.error("Error saving attendance:", error);
    res.status(500).send("Error saving attendance: " + error.message);
  }
});

/* ---------- GET ATTENDANCE ---------- */
app.get("/attendance", async (req, res) => {
  try {
    const snapshot = await db.collection("attendance").get();

    let data = {};
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });

    res.json(data);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.json({});
  }
});

app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);
