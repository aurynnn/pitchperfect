---
// Astro server action to process the pitch
import { uploadVideoToGemini, generateEmbedding, waitForFileReady, generateMRLEmbedding } from '../../lib/ai/gemini';
import { cosineSimilarity, calculateDrift, analyzeSegmentStrength } from '../../lib/analysis/similarity';
import { generateFeedback } from '../../lib/feedback/rules';
import fs from 'node:fs';
import path from 'node:path';

export const POST = async ({ request }) => {
  try {
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
        radarData: [
          { axis: 'Authority', value: 70 + Math.random() * 30 },
          { axis: 'Energy', value: 60 + Math.random() * 40 },
          { axis: 'Clarity', value: 75 + Math.random() * 25 },
          { axis: 'Gestures', value: 65 + Math.random() * 35 },
          { axis: 'Emotional', value: 70 + Math.random() * 30 },
        ]
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

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
