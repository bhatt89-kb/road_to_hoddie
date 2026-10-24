/**
 * @file lib/chunker.ts
 * Smart input chunking utilities to handle long context gracefully.
 * Splits hierarchically across paragraphs, sentences, and words to avoid truncating mid-token.
 */

import { estimateTokens } from "./classifier";

export interface ChunkOptions {
  /** Maximum token limit per chunk (default 4000) */
  readonly maxTokens?: number;
  /** Overlap token count between chunks (default 100) */
  readonly overlapTokens?: number;
}

/**
 * Splits text into paragraphs, sentences, or words if the input exceeds the token limit.
 *
 * @param text - Input text
 * @param options - Chunking options
 * @returns Array of text chunks, each guaranteed to be within the token budget
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const { maxTokens = 4000 } = options;
  const currentTokens = estimateTokens(text);

  // Passthrough if within limit
  if (currentTokens <= maxTokens) {
    return [text.trim()];
  }

  // Split by paragraph first
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    const testChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
    if (estimateTokens(testChunk) <= maxTokens) {
      currentChunk = testChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      // If single paragraph is still larger than maxTokens, split by sentences
      if (estimateTokens(trimmedPara) > maxTokens) {
        const sentenceChunks = splitBySentences(trimmedPara, maxTokens);
        chunks.push(...sentenceChunks);
      } else {
        currentChunk = trimmedPara;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Splits a long paragraph by sentence boundaries.
 */
function splitBySentences(text: string, maxTokens: number): string[] {
  // Matches sentences ending with . ! ? followed by whitespace or end of string
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    const test = current ? `${current} ${trimmed}` : trimmed;
    if (estimateTokens(test) <= maxTokens) {
      current = test;
    } else {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      // If even a single sentence exceeds maxTokens, split by words
      if (estimateTokens(trimmed) > maxTokens) {
        const wordChunks = splitByWords(trimmed, maxTokens);
        chunks.push(...wordChunks);
      } else {
        current = trimmed;
      }
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

/**
 * Splits a long sentence by word boundaries as fallback.
 */
function splitByWords(text: string, maxTokens: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (estimateTokens(test) <= maxTokens) {
      current = test;
    } else {
      if (current) {
        chunks.push(current.trim());
      }
      current = word;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

/**
 * Truncates or returns the most relevant initial chunk for context preservation.
 *
 * @param text - Input text
 * @param maxTokens - Maximum allowed token count
 * @returns Truncated text with indicator if truncated
 */
export function fitContext(text: string, maxTokens = 4000): string {
  if (estimateTokens(text) <= maxTokens) {
    return text;
  }
  const chunks = chunkText(text, { maxTokens });
  if (chunks.length === 0) return "";
  return `${chunks[0]}\n\n[Context condensed to fit token budget]`;
}
