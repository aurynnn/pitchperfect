/**
 * Cosine Similarity Analysis
 * Compares pitch embeddings with style benchmark vectors
 */

export interface SimilarityResult {
  styleId: string;
  styleName: string;
  similarity: number;
}

export interface DriftSegment {
  startTime: number;
  endTime: number;
  similarity: number;
}

export interface DriftResult {
  segments: DriftSegment[];
  trajectory: { time: number; similarity: number }[];
  averageDrift: number;
  maxDrift: number;
  driftPoints: number[];
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimension');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Compare pitch vector with multiple style vectors
 */
export function compareWithStyles(
  pitchVector: number[],
  styleVectors: { id: string; name: string; vector: number[] }[]
): SimilarityResult[] {
  return styleVectors.map(style => ({
    styleId: style.id,
    styleName: style.name,
    similarity: cosineSimilarity(pitchVector, style.vector),
  })).sort((a, b) => b.similarity - a.similarity);
}

/**
 * Calculate drift between segments using sliding window
 * Returns where the pitch loses alignment with the style
 */
export function calculateDrift(
  segmentVectors: number[][],
  styleVector: number[],
  windowDuration: number = 10, // seconds per segment
  overlap: number = 5 // seconds overlap
): DriftResult {
  const segments: DriftSegment[] = [];
  const trajectory: { time: number; similarity: number }[] = [];
  
  let similarities: number[] = [];
  
  for (let i = 0; i < segmentVectors.length; i++) {
    const segmentVector = segmentVectors[i];
    const similarity = cosineSimilarity(segmentVector, styleVector);
    
    similarities.push(similarity);
    
    const startTime = i * (windowDuration - overlap);
    const endTime = startTime + windowDuration;
    
    segments.push({
      startTime,
      endTime,
      similarity,
    });
    
    trajectory.push({
      time: startTime,
      similarity,
    });
  }
  
  // Calculate drift metrics
  let totalDrift = 0;
  let maxDrift = 0;
  const driftPoints: number[] = [];
  
  for (let i = 1; i < similarities.length; i++) {
    const drift = similarities[i - 1] - similarities[i];
    if (drift > 0.05) { // Significant drop
      driftPoints.push(i);
      totalDrift += drift;
      maxDrift = Math.max(maxDrift, drift);
    }
  }
  
  const averageDrift = similarities.length > 1 
    ? totalDrift / (similarities.length - 1) 
    : 0;
  
  return {
    segments,
    trajectory,
    averageDrift,
    maxDrift,
    driftPoints,
  };
}

/**
 * Analyze pitch strength at different time segments
 */
export function analyzeSegmentStrength(
  trajectory: { time: number; similarity: number }[]
): {
  intro: number;
  middle: number;
  close: number;
  overall: number;
} {
  if (trajectory.length === 0) {
    return { intro: 0, middle: 0, close: 0, overall: 0 };
  }
  
  const total = trajectory.reduce((sum, t) => sum + t.similarity, 0);
  const overall = total / trajectory.length;
  
  const third = Math.floor(trajectory.length / 3);
  
  const intro = trajectory.slice(0, third).reduce((sum, t) => sum + t.similarity, 0) / third;
  const middle = trajectory.slice(third, third * 2).reduce((sum, t) => sum + t.similarity, 0) / third;
  const close = trajectory.slice(third * 2).reduce((sum, t) => sum + t.similarity, 0) / (trajectory.length - third * 2);
  
  return {
    intro: intro || 0,
    middle: middle || 0,
    close: close || 0,
    overall,
  };
}
