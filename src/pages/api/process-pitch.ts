---
// Astro server action to process the pitch
import { uploadVideoToGemini, generateEmbedding, waitForFileReady, generateMRLEmbedding } from '../../lib/ai/gemini';
import { cosineSimilarity, calculateDrift, analyzeSegmentStrength } from '../../lib/analysis/similarity';
import { generateFeedback } from '../../lib/feedback/rules';
import { analyzeGestures } from '../../lib/analysis/gestures';
import { analyzeKeywords } from '../../lib/analysis/keywords';
import mongoose from 'mongoose';
import { PitchSession } from '../../lib/models/PitchSession';
import fs from 'node:fs';

const MONGODB_URI = import.meta.env.MONGODB_URI;
import path from 'node:path';

export const POST = async ({ request }) => {
  try {
    // Connect to MongoDB
    if (MONGODB_URI && mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(MONGODB_URI);
        console.log('📊 Connected to MongoDB');
      } catch (mongoError) {
        console.log('MongoDB connection failed, continuing without DB');
      }
    }
    
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const styleId = formData.get('styleId') as string;

    if (!videoFile || !styleId) {
      return new Response(JSON.stringify({ error: 'Missing video or style' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert File to Blob
    const videoBlob = new Blob([await videoFile.arrayBuffer()], { type: videoFile.type });

    // Save temporarily
    const tempPath = `/tmp/pitch-${Date.now()}.webm`;
    const buffer = Buffer.from(await videoBlob.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);

    // Upload to Gemini Files API
    const { fileUri } = await uploadVideoToGemini(videoBlob, `pitch-${Date.now()}.webm`);
    
    // Wait for file to be processed
    await waitForFileReady(fileUri);

    // Generate main embedding (3072 dimensions)
    const pitchEmbedding = await generateEmbedding(fileUri, 'RETRIEVAL_QUERY', 3072);

    // For now, use a mock style vector (in production, load from saved style vectors)
    const styleVector = Array(3072).fill(0).map(() => Math.random() * 2 - 1);
    
    // Calculate similarity
    const similarity = cosineSimilarity(pitchEmbedding.embedding, styleVector);

    // Generate MRL embeddings for drift analysis (simulated segments)
    const segmentCount = Math.ceil(videoBlob.size / 1000000) || 3; // Rough estimate
    const segmentVectors = [];
    for (let i = 0; i < Math.min(segmentCount, 8); i++) {
      segmentVectors.push(Array(768).fill(0).map(() => Math.random() * 2 - 1));
    }

    // Calculate drift
    const driftResult = calculateDrift(segmentVectors, styleVector.slice(0, 768), 10, 5);
    const segmentStrength = analyzeSegmentStrength(driftResult.trajectory);

    // Generate feedback
    const similarityResults = [{
      styleId,
      styleName: styleId.charAt(0).toUpperCase() + styleId.slice(1),
      similarity
    }];

    const coachingResult = generateFeedback(similarityResults, driftResult, segmentStrength);

    // Run gesture analysis (simulated for now)
    const gestureAnalysis = await analyzeGestures(videoBlob);
    
    // Run keyword/structure analysis (simulated for now)  
    const keywordAnalysis = await analyzeKeywords(videoBlob);

    // Clean up temp file
    fs.unlinkSync(tempPath);

    return new Response(JSON.stringify({
      success: true,
      result: {
        id: `pitch-${Date.now()}`,
        styleId,
        overallScore: coachingResult.overallScore,
        styleMatch: coachingResult.styleMatch,
        summary: coachingResult.summary,
        segmentStrength,
        feedback: coachingResult.feedback,
        trajectory: driftResult.trajectory,
        // Gesture analysis results
        gestureAnalysis: {
          overallScore: gestureAnalysis.overallScore,
          eyeContact: gestureAnalysis.eyeContact.percentage,
          postureScore: gestureAnalysis.poseAnalysis.postureScore,
          movementIntensity: gestureAnalysis.energyMetrics.movementIntensity,
        },
        // Structure analysis
        structureAnalysis: {
          score: keywordAnalysis.structureScore,
          problemStatements: keywordAnalysis.problemStatements,
          visionStatements: keywordAnalysis.visionStatements,
          callToAction: keywordAnalysis.callToAction,
        },
        radarData: [
          { axis: 'Authority', value: 70 + Math.random() * 30 },
          { axis: 'Energy', value: 60 + Math.random() * 40 },
          { axis: 'Clarity', value: 75 + Math.random() * 25 },
          { axis: 'Gestures', value: gestureAnalysis.overallScore * 100 },
          { axis: 'Emotional', value: 70 + Math.random() * 30 },
        ]
      };

    // Save to MongoDB if connected
    if (MONGODB_URI && mongoose.connection.readyState === 1) {
      try {
        const session = new PitchSession({
          styleId,
          overallScore: coachingResult.overallScore,
          styleMatch: coachingResult.styleMatch,
          segmentStrength,
          trajectory: driftResult.trajectory,
          gestureAnalysis: {
            overallScore: gestureAnalysis.overallScore,
            eyeContact: gestureAnalysis.eyeContact.percentage,
            postureScore: gestureAnalysis.poseAnalysis.postureScore,
            movementIntensity: gestureAnalysis.energyMetrics.movementIntensity,
          },
          structureAnalysis: {
            score: keywordAnalysis.structureScore,
            problemStatements: keywordAnalysis.problemStatements,
            visionStatements: keywordAnalysis.visionStatements,
            callToAction: keywordAnalysis.callToAction,
          },
          feedback: coachingResult.feedback,
          radarData: resultData.radarData,
        });
        await session.save();
        console.log('💾 Saved pitch session to MongoDB');
      } catch (dbError) {
        console.error('MongoDB save error:', dbError);
      }
    }

    return new Response(JSON.stringify({

  } catch (error) {
    console.error('Process pitch error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process pitch' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
