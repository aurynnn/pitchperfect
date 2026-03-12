import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STYLES_DIR = path.join(__dirname, '../data/styles');

export interface Style {
  id: string;
  name: string;
  description: string;
  traits: {
    energy: string;
    pace: string;
    gestures: string;
    tone: string;
  };
}

export async function loadStyles(): Promise<Style[]> {
  const styles: Style[] = [];
  
  if (!fs.existsSync(STYLES_DIR)) {
    return styles;
  }
  
  const entries = fs.readdirSync(STYLES_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const stylePath = path.join(STYLES_DIR, entry.name, 'style.json');
      
      if (fs.existsSync(stylePath)) {
        const content = fs.readFileSync(stylePath, 'utf-8');
        const styleData = JSON.parse(content);
        
        styles.push({
          id: entry.name,
          ...styleData
        });
      }
    }
  }
  
  return styles;
}

export async function getStyleById(id: string): Promise<Style | null> {
  const styles = await loadStyles();
  return styles.find(s => s.id === id) || null;
}
