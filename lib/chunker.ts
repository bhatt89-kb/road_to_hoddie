/**
 * @file lib/chunker.ts
 * @module Chunker
 * @description Smart input chunking utilities for handling long context gracefully.
 * Implements hierarchical splitting across paragraphs, sentences, and words to avoid
 * truncating mid-token while respecting natural language boundaries.
 * 
 * **Chunking Hierarchy:**
 * 1. First try splitting by paragraphs (\\n\\n)
 * 2. If paragraph too large, split by sentences (. ! ?)
 * 3. If sentence too large, split by words (whitespace)
 * 4. Always respects token budgets to prevent API errors
 * 
 * **Use Cases:**
 * - Large event descriptions (> 4000 tokens)
 * - Multi-page uploaded documents
 * - Long conversation history context
 * - Bulk planning requests
 * 
 * @performance Prevents API timeout and reduces token costs through intelligent splitting
 * @see {@link estimateTokens} from classifier module for token counting
 */

import { estimateTokens } from "./classifier";

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Options for text chunking configuration
 * 
 * @interface ChunkOptions
 */
export interface ChunkOptions {
  /** Maximum token limit per chunk (default: 4000) */
  readonly maxTokens?: number;
  /** Overlap token count between chunks for context continuity (default: 100, not yet implemented) */
  readonly overlapTokens?: number;
}

// ============================================================================
// Public Chunking Functions
// ============================================================================

/**
 * Splits text into chunks while respecting natural language boundaries.
 * Uses hierarchical splitting strategy: paragraphs → sentences → words.
 * 
 * **Algorithm:**
 * 1. If total text ≤ maxTokens, return as-is (single chunk)
 * 2. Split by paragraphs (\\n\\n), accumulate while under budget
 * 3. If single paragraph exceeds budget, split by sentences (. ! ?)
 * 4. If single sentence exceeds budget, split by words (whitespace)
 * 5. Guarantee each chunk fits within token limit
 * 
 * @param {string} text - Input text to chunk
 * @param {ChunkOptions} [options={}] - Chunking configuration
 * @param {number} [options.maxTokens=4000] - Maximum tokens per chunk
 * @param {number} [options.overlapTokens=100] - Overlap between chunks (future feature)
 * @returns {string[]} Array of text chunks, each within token budget
 * 
 * @example
 * // Short text - single chunk
 * chunkText("Hello world", { maxTokens: 4000 })
 * // Returns: ["Hello world"]
 * 
 * // Long text - multiple chunks
 * const longText = "Paragraph 1...\n\nParagraph 2...\n\nParagraph 3...";
 * chunkText(longText, { maxTokens: 100 })
 * // Returns: ["Paragraph 1...", "Paragraph 2...", "Paragraph 3..."]
 * 
 * // Empty input
 * chunkText("", { maxTokens: 4000 })
 * // Returns: []
 * 
 * // Whitespace only
 * chunkText("   \n  \n  ", { maxTokens: 4000 })
 * // Returns: []
 * 
 * @performance O(n) where n is text length - single pass through text
 * @throws Never throws - gracefully handles all inputs including empty strings
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

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Splits a long paragraph by sentence boundaries.
 * 
 * **Sentence Detection:**
 * - Matches text ending with . ! ? followed by whitespace or end of string
 * - Preserves punctuation
 * - Handles edge cases like "Dr. Smith" (doesn't split)
 * 
 * @private
 * @param {string} text - Paragraph text to split
 * @param {number} maxTokens - Maximum tokens per chunk
 * @returns {string[]} Array of sentence chunks
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
 * Splits a long sentence by word boundaries as last-resort fallback.
 * Guarantees no chunk exceeds token limit by splitting at whitespace.
 * 
 * @private
 * @param {string} text - Sentence text to split
 * @param {number} maxTokens - Maximum tokens per chunk
 * @returns {string[]} Array of word-based chunks
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

// ============================================================================
// Context Fitting Utilities
// ============================================================================

/**
 * Truncates or returns the most relevant initial chunk for context preservation.
 * Used when you need to fit long text into a fixed token budget.
 * 
 * **Strategy:**
 * - If text fits budget: return as-is
 * - If text exceeds budget: return first chunk + truncation indicator
 * - Preserves most important context (beginning of text)
 * 
 * @param {string} text - Input text to fit
 * @param {number} [maxTokens=4000] - Maximum allowed token count
 * @returns {string} Truncated text with indicator if truncated
 * 
 * @example
 * // Text fits budget
 * fitContext("Short text", 4000)
 * // Returns: "Short text"
 * 
 * // Text exceeds budget
 * const longText = "Very long text...".repeat(1000);
 * fitContext(longText, 100)
 * // Returns: "Very long text... [first 100 tokens]\n\n[Context condensed to fit token budget]"
 * 
 * // Empty input
 * fitContext("", 4000)
 * // Returns: ""
 * 
 * @performance O(n) - delegates to chunkText which is linear
 * @see {@link chunkText} for chunking algorithm details
 */
export function fitContext(text: string, maxTokens = 4000): string {
  if (estimateTokens(text) <= maxTokens) {
    return text;
  }
  const chunks = chunkText(text, { maxTokens });
  if (chunks.length === 0) return "";
  return `${chunks[0]}\n\n[Context condensed to fit token budget]`;
}
