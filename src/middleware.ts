---
// Session middleware for PitchPerfect
import mongoose from 'mongoose';
import { PitchSession } from '../lib/models/PitchSession';

const MONGODB_URI = import.meta.env.MONGODB_URI;

export const pitchMiddleware = async (context: any, next: any) => {
  // Connect to MongoDB if needed
  if (MONGODB_URI && mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('📊 Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  }
  
  return next();
};

export { PitchSession };
