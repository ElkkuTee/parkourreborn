import { doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const getUserStats = async (userId) => {
  try {
    const userStatsRef = collection(db, 'userStats', userId, 'techs');
    const snapshot = await getDocs(userStatsRef);
    
    const stats = {};
    snapshot.forEach(doc => {
      stats[doc.id] = doc.data();
    });
    
    return stats;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {};
  }
};

export const updateTechProficiency = async (userId, techId, proficiencyLevel, attempted = true) => {
  try {
    const techRef = doc(db, 'userStats', userId, 'techs', techId);
    await setDoc(techRef, {
      proficiencyLevel,
      attempted,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating tech proficiency:', error);
    throw error;
  }
};

export const removeTechProficiency = async (userId, techId) => {
  try {
    const techRef = doc(db, 'userStats', userId, 'techs', techId);
    await deleteDoc(techRef);
  } catch (error) {
    console.error('Error removing tech proficiency:', error);
    throw error;
  }
};