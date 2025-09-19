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

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    await verifyAdmin(req);

    if (req.method === 'POST') {
      // Add new tech
      const { name, description, difficulty, tags, aka, videoUrl } = req.body;
      
      const docRef = await db.collection('techs').add({
        name,
        description,
        difficulty: Number(difficulty),
        tags: tags || [],
        aka: aka || [],
        videoUrl: videoUrl || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.status(201).json({ id: docRef.id, message: 'Tech created successfully' });
      
    } else if (req.method === 'PUT') {
      // Update existing tech
      const { id, ...updateData } = req.body;
      
      if (updateData.difficulty) {
        updateData.difficulty = Number(updateData.difficulty);
      }
      
      await db.collection('techs').doc(id).update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
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
