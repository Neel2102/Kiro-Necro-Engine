import { diffLines } from 'diff';

export interface FileDiff {
  filePath: string;
  additions: number;
  deletions: number;
  unified: string;
}

export const generateUnifiedDiff = (
  filePath: string,
  oldText: string,
  newText: string
): FileDiff => {
  const parts = diffLines(oldText, newText);
  let additions = 0;
  let deletions = 0;
  const unifiedChunks: string[] = [];

  parts.forEach((part) => {
    if (part.added) {
      additions += part.count ?? 0;
      unifiedChunks.push(`+${part.value}`);
    } else if (part.removed) {
      deletions += part.count ?? 0;
      unifiedChunks.push(`-${part.value}`);
    } else {
      unifiedChunks.push(` ${part.value}`);
    }
  });

  return {
    filePath,
    additions,
    deletions,
    unified: unifiedChunks.join(''),
  };
};

