// src/api/techs.js
import express from "express";
import cors from "cors";
import admin from "firebase-admin";

// Initialize Firebase Admin with environment variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

/**
 * GET /api/techs
 * Supports query params: search, sort, difficulty, tags
 */
app.get("/api/techs", async (req, res) => {
  try {
    const { search, sort, difficulty, tags } = req.query;

    let query = db.collection("techs");

    // Filter by difficulty
    if (difficulty) {
      query = query.where("difficulty", "==", Number(difficulty));
    }

    const snapshot = await query.get();
    let data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Filter by search keyword (in-memory)
    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (tech) =>
          tech.name.toLowerCase().includes(lower) ||
          tech.description.toLowerCase().includes(lower) ||
          (tech.tags && tech.tags.some((tag) => tag.toLowerCase().includes(lower)))
      );
    }

    // Filter by tags (comma-separated)
    if (tags) {
      const tagArray = tags.split(",");
      data = data.filter((tech) =>
        tagArray.every((tag) => tech.tags && tech.tags.includes(tag))
      );
    }

    // Sorting
    if (sort) {
      switch (sort) {
        case "az":
          data.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "za":
          data.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case "diff_asc":
          data.sort((a, b) => a.difficulty - b.difficulty);
          break;
        case "diff_desc":
          data.sort((a, b) => b.difficulty - a.difficulty);
          break;
      }
    }

    res.json({ data });
  } catch (err) {
    console.error("Error fetching techs:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/techs/:id
 */
app.get("/api/techs/:id", async (req, res) => {
  try {
    const doc = await db.collection("techs").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Tech not found" });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Error fetching tech:", err);
    res.status(500).json({ error: err.message });
  }
});

// Export Express app for Vercel
export default app;
