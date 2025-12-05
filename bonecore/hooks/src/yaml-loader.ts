// bonecore/hooks/src/yaml-loader.ts
import { readFile } from 'node:fs/promises';
import yaml from 'js-yaml';

export async function loadYaml<T = any>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return yaml.load(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`Error loading YAML from ${filePath}:`, error);
    }
    return null;
  }
}