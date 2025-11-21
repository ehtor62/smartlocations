import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { tagGroups as defaultTagGroups } from "./allowedtags";

export interface UserAttractionsData {
  tags: string[];
  lastUpdated: Date;
  customCategories?: string[]; // Track which categories contributed to attractions
}

/**
 * Save user's custom attractions tags to Firestore
 */
export const saveUserAttractions = async (userId: string, attractionsTags: string[], contributingCategories: string[] = []): Promise<void> => {
  try {
    const userAttractionsRef = doc(db, 'users', userId, 'preferences', 'attractions');
    
    const data: UserAttractionsData = {
      tags: attractionsTags,
      lastUpdated: new Date(),
      customCategories: contributingCategories
    };
    
    await setDoc(userAttractionsRef, data);
    console.log('User attractions saved successfully');
  } catch (error: unknown) {
    console.error('Error saving user attractions:', error);
    
    // Handle specific offline error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'unavailable') {
      console.log('Cannot save attractions - Firestore is offline');
    } else if (error && typeof error === 'object' && 'message' in error && 
               typeof error.message === 'string' && error.message.includes('offline')) {
      console.log('Cannot save attractions - Client is offline');
    }
    
    throw error;
  }
};

/**
 * Load user's custom attractions tags from Firestore
 */
export const loadUserAttractions = async (userId: string): Promise<{ tags: string[], customCategories: string[] }> => {
  try {
    const userAttractionsRef = doc(db, 'users', userId, 'preferences', 'attractions');
    const docSnap = await getDoc(userAttractionsRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as UserAttractionsData;
      console.log('Loaded user attractions from Firestore');
      return {
        tags: data.tags || defaultTagGroups.Favorites,
        customCategories: data.customCategories || []
      };
    } else {
      console.log('No custom attractions found, using defaults');
      return {
        tags: defaultTagGroups.Favorites,
        customCategories: []
      };
    }
  } catch (error: unknown) {
    console.error('Error loading user attractions:', error);
    
    // Handle specific offline error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'unavailable') {
      console.log('Firestore is offline, using default attractions');
    } else if (error && typeof error === 'object' && 'message' in error && 
               typeof error.message === 'string' && error.message.includes('offline')) {
      console.log('Client is offline, using default attractions');
    }
    
    // Fallback to defaults on any error
    return {
      tags: defaultTagGroups.Favorites,
      customCategories: []
    };
  }
};

/**
 * Reset user's attractions to default
 */
export const resetUserAttractions = async (userId: string): Promise<void> => {
  try {
    const userAttractionsRef = doc(db, 'users', userId, 'preferences', 'attractions');
    
    const data: UserAttractionsData = {
      tags: defaultTagGroups.Favorites,
      lastUpdated: new Date(),
      customCategories: []
    };
    
    await setDoc(userAttractionsRef, data);
    console.log('User attractions reset to default');
  } catch (error) {
    console.error('Error resetting user attractions:', error);
    throw error;
  }
};