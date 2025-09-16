import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/techs
app.get("/", async (req, res) => {
  const { search, sort, difficulty, tags } = req.query;
  let snapshot = await db.collection("techs").get();
  let techs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  if (search) {
    const s = search.toLowerCase();
    techs = techs.filter(t =>
      t.name.toLowerCase().includes(s) ||
      t.description.toLowerCase().includes(s)
    );
  }

  if (difficulty) {
    if (difficulty.includes("-")) {
      const [min, max] = difficulty.split("-").map(Number);
      techs = techs.filter(t => t.difficulty >= min && t.difficulty <= max);
    } else {
      techs = techs.filter(t => t.difficulty == Number(difficulty));
    }
  }

  if (tags) {
    const tagList = tags.split(",").map(t => t.trim().toLowerCase());
    techs = techs.filter(t =>
      t.tags && t.tags.some(tag => tagList.includes(tag.toLowerCase()))
    );
  }

  switch (sort) {
    case "az": techs.sort((a,b)=>a.name.localeCompare(b.name)); break;
    case "za": techs.sort((a,b)=>b.name.localeCompare(a.name)); break;
    case "diff_asc": techs.sort((a,b)=>a.difficulty-b.difficulty); break;
    case "diff_desc": techs.sort((a,b)=>b.difficulty-a.difficulty); break;
  }

  res.json({ data: techs });
});

// GET /api/techs/:id
app.get("/:id", async (req, res) => {
  const doc = await db.collection("techs").doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: "Not found" });
  res.json({ id: doc.id, ...doc.data() });
});

export default app;
