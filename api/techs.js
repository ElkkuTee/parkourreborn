import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import serverless from "serverless-http";

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_KEY_BASE64, "base64").toString("utf-8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/techs", async (req, res) => {
  try {
    const { search, sort, difficulty, tags } = req.query;

    let query = db.collection("techs");

    if (difficulty) query = query.where("difficulty", "==", Number(difficulty));

    const snapshot = await query.get();
    let data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (tech) =>
          tech.name?.toLowerCase().includes(lower) ||
          tech.description?.toLowerCase().includes(lower) ||
          (tech.tags && tech.tags.some((tag) => tag.toLowerCase().includes(lower)))
      );
    }

    if (tags) {
      const tagArray = tags.split(",");
      data = data.filter((tech) => tagArray.every((tag) => tech.tags && tech.tags.includes(tag)));
    }

    if (sort) {
      switch (sort) {
        case "az":
          data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          break;
        case "za":
          data.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
          break;
        case "diff_asc":
          data.sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0));
          break;
        case "diff_desc":
          data.sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0));
          break;
      }
    }

    res.json({ data });
  } catch (err) {
    console.error("Error fetching techs:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/techs/:id", async (req, res) => {
  try {
    const doc = await db.collection("techs").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Tech not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Error fetching tech:", err);
    res.status(500).json({ error: err.message });
  }
});

// Wrap Express app for Vercel
export default serverless(app);
