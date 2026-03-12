/**
 * Coaching Feedback Rules Engine
 * Converts analysis into actionable coaching insights
 */

import type { SimilarityResult, DriftResult } from './similarity';

export interface FeedbackItem {
  type: 'strength' | 'improvement' | 'warning';
  category: string;
  title: string;
  message: string;
  priority: number;
}

export interface CoachingResult {
  overallScore: number;
  primaryStyle: string;
  styleMatch: number;
  feedback: FeedbackItem[];
  summary: string;
}

/**
 * Generate coaching feedback from analysis results
 */
export function generateFeedback(
  similarityResults: SimilarityResult[],
  driftResult: DriftResult | null,
  segmentStrength: { intro: number; middle: number; close: number; overall: number }
): CoachingResult {
  const feedback: FeedbackItem[] = [];
  
  // Best style match
  const primaryStyle = similarityResults[0];
  const styleMatch = primaryStyle?.similarity || 0;
  
  // Overall score (0-100)
  const overallScore = Math.round(styleMatch * 100);
  
  // Strength-based feedback
  if (segmentStrength.intro > 0.7) {
    feedback.push({
      type: 'strength',
      category: 'Opening',
      title: 'Strong Opening',
      message: 'Your pitch starts with excellent style alignment. Great first impression!',
      priority: 3,
    });
  }
  
  if (segmentStrength.close > 0.7) {
    feedback.push({
      type: 'strength',
      category: 'Closing',
      title: 'Powerful Close',
      message: 'You maintain style consistency through your closing. Well done!',
      priority: 3,
    });
  }
  
  // Improvement feedback
  if (segmentStrength.intro < 0.5 && segmentStrength.intro > 0) {
    feedback.push({
      type: 'improvement',
      category: 'Opening',
      title: 'Strengthen Your Intro',
      message: 'Your opening could use more energy. Practice starting with confidence.',
      priority: 2,
    });
  }
  
  if (segmentStrength.middle < 0.5 && segmentStrength.middle > 0) {
    feedback.push({
      type: 'improvement',
      category: 'Body',
      title: 'Stay Consistent',
      message: 'Your middle section shows some drift. Try to maintain the same energy throughout.',
      priority: 2,
    });
  }
  
  if (segmentStrength.close < 0.5 && segmentStrength.close > 0) {
    feedback.push({
      type: 'improvement',
      category: 'Closing',
      title: 'Finish Strong',
      message: 'Your closing loses style alignment. End with the same conviction as your opening.',
      priority: 2,
    });
  }
  
  // Drift warnings
  if (driftResult && driftResult.driftPoints.length > 0) {
    feedback.push({
      type: 'warning',
      category: 'Consistency',
      title: 'Style Drift Detected',
      message: `Found ${driftResult.driftPoints.length} moment(s) where your style drops. Review these points.`,
      priority: 1,
    });
  }
  
  if (driftResult && driftResult.maxDrift > 0.2) {
    feedback.push({
      type: 'warning',
      category: 'Consistency',
      title: 'Significant Energy Drop',
      message: 'A major drop in style alignment was detected. Focus on maintaining energy.',
      priority: 1,
    });
  }
  
  // Generate summary
  let summary = '';
  if (overallScore >= 80) {
    summary = `Excellent! Your pitch aligns ${Math.round(styleMatch * 100)}% with ${primaryStyle?.styleName || 'the selected'} style. You're ready to present!`;
  } else if (overallScore >= 60) {
    summary = `Good effort! Your pitch matches ${Math.round(styleMatch * 100)}% with ${primaryStyle?.styleName || 'the selected'} style. A few tweaks will make it perfect.`;
  } else if (overallScore >= 40) {
    summary = `Keep practicing! Your pitch matches ${Math.round(styleMatch * 100)}% with ${primaryStyle?.styleName || 'the selected'} style. Focus on consistency.`;
  } else {
    summary = `Room to grow! Consider studying more ${primaryStyle?.styleName || 'target'} style presentations and practicing your delivery.`;
  }
  
  // Sort by priority
  feedback.sort((a, b) => b.priority - a.priority);
  
  return {
    overallScore,
    primaryStyle: primaryStyle?.styleName || 'Unknown',
    styleMatch,
    feedback,
    summary,
  };
}

/**
 * Get color for score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981'; // green
  if (score >= 60) return '#f59e0b'; // amber
  if (score >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
}

/**
 * Get label for similarity
 */
export function getSimilarityLabel(similarity: number): string {
  if (similarity >= 0.8) return 'Excellent';
  if (similarity >= 0.6) return 'Good';
  if (similarity >= 0.4) return 'Fair';
  return 'Needs Work';
}
