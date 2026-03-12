/**
 * Process Style Benchmarks
 * 
 * This script generates style vectors from benchmark videos.
 * Run with: npx tsx scripts/processStyleBenchmarks.ts
 * 
 * Pipeline:
 * 1. Load benchmark videos from /data/styles/[style]/
 * 2. Upload to Gemini Files API
 * 3. Generate embedding (3072 dimensions)
 * 4. Save style_vector.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STYLES_DIR = path.join(__dirname, '../src/data/styles');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyD4NGSUlkEmUJJL7paxTgrA3yRyFMp-x9g';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface StyleConfig {
  name: string;
  description: string;
  benchmarkVideos: string[];
  traits: Record<string, string>;
}

async function uploadToGemini(videoPath: string): Promise<string> {
  console.log(`  📤 Uploading ${path.basename(videoPath)}...`);
  
  const videoBuffer = fs.readFileSync(videoPath);
  const base64 = videoBuffer.toString('base64');
  
  // Upload to Gemini Files API
  const endpoint = 'https://generativelanguage.googleapis.com/upload/v1beta/files';
  const metadata = {
    file: {
      display_name: path.basename(videoPath),
    }
  };
  
  const boundary = '-------' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;
  
  const metadataPart = delimiter + 
    'Content-Type: application/json\r\n\r\n' + 
    JSON.stringify(metadata);
    
  const filePart = delimiter + 
    'Content-Type: video/mp4\r\n\r\n' + 
    base64 + 
    closeDelimiter;
  
  const response = await fetch(`${endpoint}?upload_type=media`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GEMINI_API_KEY}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: metadataPart + filePart,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }
  
  const data = await response.json();
  const fileUri = data.file?.uri || data.uri;
  
  console.log(`  ✅ Uploaded: ${fileUri}`);
  
  // Wait for file to be processed
  await waitForFileReady(fileUri);
  
  return fileUri;
}

async function waitForFileReady(fileUri: string, maxAttempts: number = 30): Promise<void> {
  const fileName = fileUri.split('/').pop();
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${fileName}`, {
      headers: { 'Authorization': `Bearer ${GEMINI_API_KEY}` },
    });
    
    if (!response.ok) {
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    
    const data = await response.json();
    
    if (data.file?.state?.state === 'ACTIVE') {
      return;
    }
    
    if (data.file?.state?.state === 'FAILED') {
      throw new Error('File processing failed');
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  throw new Error('File processing timeout');
}

async function generateStyleVector(fileUri: string): Promise<number[]> {
  console.log(`  🧠 Generating embedding...`);
  
  const model = genAI.getGenerativeModel({
    model: 'gemini-embedding-2-preview',
  });
  
  const result = await model.embedContent([
    {
      fileData: {
        mimeType: 'video/mp4',
        fileUri: fileUri,
      },
    },
    {
      text: 'Analyze this presentation video and create an embedding that captures the speaking style, tone, gestures, energy, and presentation patterns.',
    }
  ], {
    taskType: 'RETRIEVAL_DOCUMENT',
    outputDimensionality: 3072,
  });
  
  const embedding = result.embedding?.values || [];
  
  console.log(`  ✅ Generated vector with ${embedding.length} dimensions`);
  
  return embedding;
}

async function processStyle(styleDir: string): Promise<void> {
  const styleName = path.basename(styleDir);
  console.log(`\n🎬 Processing style: ${styleName}`);
  
  // Load style config
  const configPath = path.join(styleDir, 'style.json');
  if (!fs.existsSync(configPath)) {
    console.log(`  ⚠️ No style.json found, skipping`);
    return;
  }
  
  const config: StyleConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  if (!config.benchmarkVideos || config.benchmarkVideos.length === 0) {
    console.log(`  ⚠️ No benchmark videos defined, skipping`);
    return;
  }
  
  // Process each benchmark video
  const vectors: number[][] = [];
  
  for (const videoFile of config.benchmarkVideos) {
    const videoPath = path.join(styleDir, videoFile);
    
    if (!fs.existsSync(videoPath)) {
      console.log(`  ⚠️ Video not found: ${videoFile}, skipping`);
      continue;
    }
    
    try {
      // Upload to Gemini
      const fileUri = await uploadToGemini(videoPath);
      
      // Generate embedding
      const vector = await generateStyleVector(fileUri);
      vectors.push(vector);
      
    } catch (error) {
      console.log(`  ❌ Error processing ${videoFile}:`, error);
    }
  }
  
  if (vectors.length === 0) {
    console.log(`  ❌ No vectors generated`);
    return;
  }
  
  // Average the vectors
  const avgVector: number[] = [];
  for (let i = 0; i < 3072; i++) {
    let sum = 0;
    for (const v of vectors) {
      sum += v[i] || 0;
    }
    avgVector.push(sum / vectors.length);
  }
  
  // Save style vector
  const vectorPath = path.join(styleDir, 'style_vector.json');
  fs.writeFileSync(vectorPath, JSON.stringify({
    dimension: 3072,
    vector: avgVector,
    generatedAt: new Date().toISOString(),
    sourceVideos: config.benchmarkVideos,
  }, null, 2));
  
  console.log(`  ✅ Saved style vector to ${vectorPath}`);
}

async function main() {
  console.log('🎯 PitchPerfect Style Benchmark Processor');
  console.log('=========================================\n');
  
  // Check for API key
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    process.exit(1);
  }
  
  // Get all style directories
  const entries = fs.readdirSync(STYLES_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const styleDir = path.join(STYLES_DIR, entry.name);
      await processStyle(styleDir);
    }
  }
  
  console.log('\n✅ All styles processed!');
}

main().catch(console.error);
