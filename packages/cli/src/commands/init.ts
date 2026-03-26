import { writeFile, access } from 'fs/promises';
import path from 'path';
import { DEFAULT_CONFIG } from '@holi.dev/core';

export async function init(dir: string): Promise<void> {
  const dest = path.join(dir, 'holi.config.json');
  try {
    await access(dest);
    console.log('holi.config.json already exists. Nothing was changed.');
    return;
  } catch {
    // file does not exist — proceed
  }
  await writeFile(dest, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
  console.log('✓ Created holi.config.json');
  console.log('  Edit it, then run: holi build');
}
