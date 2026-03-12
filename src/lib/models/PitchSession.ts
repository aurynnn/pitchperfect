import mongoose, { Schema, Document } from 'mongoose';

export interface IPitchSession extends Document {
  userId?: string;
  styleId: string;
  videoUrl?: string;
  embedding?: number[];
  overallScore: number;
  styleMatch: number;
  segmentStrength: {
    intro: number;
    middle: number;
    close: number;
    overall: number;
  };
  trajectory: { time: number; similarity: number }[];
  gestureAnalysis?: {
    overallScore: number;
    eyeContact: number;
    postureScore: number;
    movementIntensity: number;
  };
  structureAnalysis?: {
    score: number;
    problemStatements: number;
    visionStatements: number;
    callToAction: number;
  };
  feedback: {
    type: string;
    category: string;
    title: string;
    message: string;
  }[];
  radarData: { axis: string; value: number }[];
  createdAt: Date;
}

const PitchSessionSchema = new Schema<IPitchSession>({
  userId: { type: String },
  styleId: { type: String, required: true },
  videoUrl: { type: String },
  embedding: [{ type: Number }],
  overallScore: { type: Number, required: true },
  styleMatch: { type: Number, required: true },
  segmentStrength: {
    intro: { type: Number },
    middle: { type: Number },
    close: { type: Number },
    overall: { type: Number }
  },
  trajectory: [{
    time: { type: Number },
    similarity: { type: Number }
  }],
  gestureAnalysis: {
    overallScore: { type: Number },
    eyeContact: { type: Number },
    postureScore: { type: Number },
    movementIntensity: { type: Number }
  },
  structureAnalysis: {
    score: { type: Number },
    problemStatements: { type: Number },
    visionStatements: { type: Number },
    callToAction: { type: Number }
  },
  feedback: [{
    type: { type: String },
    category: { type: String },
    title: { type: String },
    message: { type: String }
  }],
  radarData: [{
    axis: { type: String },
    value: { type: Number }
  }]
}, { timestamps: true });

export const PitchSession = mongoose.models.PitchSession || mongoose.model<IPitchSession>('PitchSession', PitchSessionSchema);
