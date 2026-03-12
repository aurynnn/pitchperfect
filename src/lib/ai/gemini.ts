import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = import.meta.env.GEMINI_API_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
}

export interface FileUploadResult {
  fileUri: string;
  fileName: string;
}

/**
 * Upload a video file to Gemini Files API
 */
export async function uploadVideoToGemini(
  videoBlob: Blob,
  fileName: string
): Promise<FileUploadResult> {
  const endpoint = `${GEMINI_ENDPOINT}/files`;
  
  // Convert blob to base64
  const base64 = await blobToBase64(videoBlob);
  
  const metadata = {
    file: {
      display_name: fileName,
    }
  };
  
  // Create multipart request
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
    throw new Error(`Failed to upload video: ${error}`);
  }
  
  const data = await response.json();
  
  return {
    fileUri: data.file?.uri || data.uri,
    fileName: data.file?.display_name || fileName,
  };
}

/**
 * Generate multimodal embedding from video using Gemini
 */
export async function generateEmbedding(
  fileUri: string,
  taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' = 'RETRIEVAL_QUERY',
  outputDimensions: number = 3072
): Promise<EmbeddingResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-embedding-2-preview',
    generationConfig: {
      temperature: 0.1,
    }
  });
  
  // For multimodal embedding, we need to use the content API
  const result = await model.embedContent([
    {
      fileData: {
        mimeType: 'video/mp4',
        fileUri: fileUri,
      },
    },
    {
      text: 'Analyze this pitch video and create an embedding that captures speaking style, tone, gestures, and presentation patterns.',
    }
  ], {
    taskType,
    outputDimensionality: outputDimensions,
  });
  
  const embedding = result.embedding?.values || [];
  
  return {
    embedding,
    dimensions: embedding.length,
  };
}

/**
 * Generate embedding at lower dimension using MRL (Matryoshka Representation Learning)
 * for faster drift analysis
 */
export async function generateMRLEmbedding(
  fileUri: string,
  outputDimensions: number = 768
): Promise<EmbeddingResult> {
  return generateEmbedding(fileUri, 'RETRIEVAL_QUERY', outputDimensions);
}

/**
 * Wait for Gemini file to be processed
 */
export async function waitForFileReady(fileUri: string, maxAttempts: number = 30): Promise<boolean> {
  const fileName = fileUri.split('/').pop();
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${GEMINI_ENDPOINT}/files/${fileName}`, {
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
      },
    });
    
    if (!response.ok) {
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    
    const data = await response.json();
    
    if (data.file?.state?.state === 'ACTIVE') {
      return true;
    }
    
    if (data.file?.state?.state === 'FAILED') {
      throw new Error('File processing failed');
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  throw new Error('File processing timeout');
}

/**
 * Helper: Convert Blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
