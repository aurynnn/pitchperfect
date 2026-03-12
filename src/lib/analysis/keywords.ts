/**
 * Keyword Density Analysis
 * Analyzes pitch structure and storytelling elements
 * Note: This is optional - STT is not required for similarity detection
 */

export interface KeywordAnalysis {
  problemStatements: number;
  visionStatements: number;
  callToAction: number;
  storytellingElements: number;
  structureScore: number;
  recommendations: string[];
}

export interface StoryBeat {
  timestamp: number;
  type: 'hook' | 'problem' | 'solution' | 'vision' | 'proof' | 'cta';
  confidence: number;
}

/**
 * Analyze pitch structure
 * This is a placeholder - would require STT in production
 */
export async function analyzeKeywords(audioBlob: Blob): Promise<KeywordAnalysis> {
  // In production, this would:
  // 1. Use Speech-to-Text (STT)
  // 2. Analyze keyword density
  // 3. Detect storytelling beats
  
  // For demo, return mock structure analysis
  const recommendations: string[] = [];

  return {
    problemStatements: 3,
    visionStatements: 2,
    callToAction: 1,
    storytellingElements: 5,
    structureScore: 0.75,
    recommendations,
  };
}

/**
 * Detect story beats in pitch (placeholder for STT-based analysis)
 */
export function detectStoryBeats(text: string): StoryBeat[] {
  const beats: StoryBeat[] = [];
  
  const patterns = {
    hook: /(hi|hey|hello|imagine|what if|did you know|have you ever)/i,
    problem: /(problem|challenge|struggle|difficult|hard|issue|pain)/i,
    solution: /(solution|answer|fix|help|can help|improve)/i,
    vision: /(future|imagine|vision|dream|bigger|transform)/i,
    proof: /(example|case study|data|results|proved|research)/i,
    cta: /(sign up|buy|get started|join|contact|now|today|limited)/i,
  };

  const sentences = text.split(/[.!?]+/);
  
  sentences.forEach((sentence, i) => {
    const timestamp = i * 3; // Approximate 3 seconds per sentence
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(sentence)) {
        beats.push({
          timestamp,
          type: type as StoryBeat['type'],
          confidence: 0.7 + Math.random() * 0.3,
        });
      }
    }
  });

  return beats;
}

/**
 * Calculate structure score based on story beats
 */
export function calculateStructureScore(beats: StoryBeat[]): number {
  if (beats.length === 0) return 0;

  const hasHook = beats.some(b => b.type === 'hook');
  const hasProblem = beats.some(b => b.type === 'problem');
  const hasSolution = beats.some(b => b.type === 'solution');
  const hasVision = beats.some(b => b.type === 'vision');
  const hasCTA = beats.some(b => b.type === 'cta');

  let score = 0;
  if (hasHook) score += 0.15;
  if (hasProblem) score += 0.2;
  if (hasSolution) score += 0.2;
  if (hasVision) score += 0.2;
  if (hasCTA) score += 0.25;

  return score;
}
