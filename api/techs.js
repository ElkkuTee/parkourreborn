import express from "express";
import cors from "cors";
import admin from "firebase-admin";

// Load service account credentials from env variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Initialize Firebase Admin (only once per runtime)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Create express app
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

    // Filtering by difficulty
    if (difficulty) {
      query = query.where("difficulty", "==", Number(difficulty));
    }

    // Execute query
    const snapshot = await query.get();
    let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filtering by search keyword (in-memory, simple match)
    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        tech =>
          tech.name.toLowerCase().includes(lower) ||
          tech.description.toLowerCase().includes(lower) ||
          (tech.tags && tech.tags.some(tag => tag.toLowerCase().includes(lower)))
      );
    }

    // Filtering by tags (comma-separated)
    if (tags) {
      const tagArray = tags.split(",");
      data = data.filter(tech =>
        tagArray.every(tag => tech.tags && tech.tags.includes(tag))
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
    res.status(500).json({ error: err.message });
  }
});

// Export the Express app as the default export for Vercel
export default app;
