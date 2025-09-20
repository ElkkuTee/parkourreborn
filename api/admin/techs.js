import admin from '../_utils/firebase.js';

const ADMIN_DISCORD_IDS = [
  '1020704620722528256', 
  '901026157196107806'   
];

async function verifyAdmin(req) {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (!idToken) throw new Error('No authorization token');
  
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const user = await admin.auth().getUser(decodedToken.uid);
  const customClaims = user.customClaims || {};
  
  if (!ADMIN_DISCORD_IDS.includes(customClaims.discord_id)) {
    throw new Error('Unauthorized');
  }
}

// Function to generate document ID from tech name
function generateDocumentId(techName) {
  return techName
    .toLowerCase()
    .replace(/\s+/g, '') // Remove all spaces (including multiple consecutive spaces)
    .replace(/[^a-z0-9]/g, ''); // Remove all special characters and punctuation
}

// Function to find available document ID (handles duplicates)
async function findAvailableDocumentId(db, baseName) {
  const baseId = generateDocumentId(baseName);
  
  // Check if base ID is available
  const baseDoc = await db.collection('techs').doc(baseId).get();
  if (!baseDoc.exists) {
    return baseId;
  }
  
  // If base ID exists, try with number suffixes
  let counter = 2;
  while (counter <= 100) { // Prevent infinite loop
    const numberedId = `${baseId}${counter}`;
    const numberedDoc = await db.collection('techs').doc(numberedId).get();
    if (!numberedDoc.exists) {
      return numberedId;
    }
    counter++;
  }
  
  throw new Error('Unable to generate unique document ID after 100 attempts');
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    await verifyAdmin(req);

    if (req.method === 'POST') {
      // Add new tech
      const { name, description, difficulty, tags, aka, videoUrl } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Tech name is required' });
      }
      
      if (!description || !description.trim()) {
        return res.status(400).json({ error: 'Tech description is required' });
      }
      
      // Generate unique document ID
      const docId = await findAvailableDocumentId(db, name.trim());
      
      // Build document with required fields
      const techDoc = {
        name: name.trim(),
        description: description.trim(),
        difficulty: difficulty ? String(difficulty) : "?",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Only include optional fields if they have values
      if (tags && Array.isArray(tags) && tags.length > 0) {
        techDoc.tags = tags;
      }
      
      if (aka && Array.isArray(aka) && aka.length > 0) {
        techDoc.aka = aka;
      }
      
      if (videoUrl && videoUrl.trim()) {
        techDoc.videoUrl = videoUrl.trim();
      }
      
      await db.collection('techs').doc(docId).set(techDoc);
      
      res.status(201).json({ id: docId, message: 'Tech created successfully' });
      
    } else if (req.method === 'PUT') {
      // Update existing tech
      const { id, ...updateData } = req.body;
      
      // Build update object with only fields that should be updated
      const updateDoc = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Handle required fields
      if (updateData.name !== undefined) {
        if (!updateData.name || !updateData.name.trim()) {
          return res.status(400).json({ error: 'Tech name cannot be empty' });
        }
        updateDoc.name = updateData.name.trim();
      }
      
      if (updateData.description !== undefined) {
        if (!updateData.description || !updateData.description.trim()) {
          return res.status(400).json({ error: 'Tech description cannot be empty' });
        }
        updateDoc.description = updateData.description.trim();
      }
      
      if (updateData.difficulty !== undefined) {
        updateDoc.difficulty = updateData.difficulty ? String(updateData.difficulty) : "?";
      }
      
      // Handle optional fields - only update if they have values, otherwise remove them
      if (updateData.tags !== undefined) {
        if (Array.isArray(updateData.tags) && updateData.tags.length > 0) {
          updateDoc.tags = updateData.tags;
        } else {
          updateDoc.tags = admin.firestore.FieldValue.delete();
        }
      }
      
      if (updateData.aka !== undefined) {
        if (Array.isArray(updateData.aka) && updateData.aka.length > 0) {
          updateDoc.aka = updateData.aka;
        } else {
          updateDoc.aka = admin.firestore.FieldValue.delete();
        }
      }
      
      if (updateData.videoUrl !== undefined) {
        if (updateData.videoUrl && updateData.videoUrl.trim()) {
          updateDoc.videoUrl = updateData.videoUrl.trim();
        } else {
          updateDoc.videoUrl = admin.firestore.FieldValue.delete();
        }
      }
      
      await db.collection('techs').doc(id).update(updateDoc);
      
      res.status(200).json({ message: 'Tech updated successfully' });
      
    } else if (req.method === 'DELETE') {
      // Delete tech
      const { id } = req.query;
      
      await db.collection('techs').doc(id).delete();
      
      res.status(200).json({ message: 'Tech deleted successfully' });
      
    } else {
      res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
    
  } catch (error) {
    console.error('Admin API error:', error);
    if (error.message === 'Unauthorized') {
      res.status(403).json({ error: 'Admin access required' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}
