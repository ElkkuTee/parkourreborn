import admin from "firebase-admin";

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_KEY_BASE64, "base64").toString("utf-8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { search, sort, difficulty, tags, id } = req.query;

      // If ID is provided, fetch single doc
      if (id) {
        const doc = await db.collection("techs").doc(id).get();
        if (!doc.exists) return res.status(404).json({ error: "Tech not found" });
        return res.json({ id: doc.id, ...doc.data() });
      }

      // Otherwise fetch collection
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
            (tech.tags && tech.tags.some((tag) => tag.toLowerCase().includes(lower))) ||
            (tech.aka && tech.aka.some((alias) => alias.toLowerCase().includes(lower)))
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

      return res.json({ data });
    } else {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    console.error("Error in API:", err);
    return res.status(500).json({ error: err.message });
  }
}
