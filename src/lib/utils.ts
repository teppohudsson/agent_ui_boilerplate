import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ChatSegment } from "./types/chat-segments"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_name'; content: string }
  | { type: 'question'; content: string }
  | { type: 'write_to_doc'; content: string };

/**
 * Parses raw text content into an array of ChatSegment objects.
 * Identifies different segment types based on content patterns.
 *
 * @param content The raw text content to parse
 * @returns An array of ChatSegment objects
 */
export function parseContentToSegments(content: string): ChatSegment[] {
  const segments: ChatSegment[] = [];
  
  // Store matched segments with their positions
  const matches: {start: number; end: number; segment: ChatSegment}[] = [];
  
  // Process the content to find tags
  let remainingContent = content;
  let currentPosition = 0;
  
  // Regular expression to find any opening tag
  const tagRegex = /<(\w+)>/i;
  
  while (remainingContent.length > 0) {
    // Find the next tag
    const toolTagMatch = remainingContent.match(tagRegex);
    
    if (!toolTagMatch) {
      // No more tags found, add remaining content as text if any
      if (remainingContent.trim()) {
        matches.push({
          start: currentPosition,
          end: currentPosition + remainingContent.length,
          segment: { type: 'text', content: remainingContent.trim() }
        });
      }
      break;
    }
    
    // Since we've checked toolTagMatch is not null, we can safely use its properties
    const matchIndex = toolTagMatch.index || 0;
    const matchLength = toolTagMatch[0].length;
    
    // Add text before the tag if any
    if (matchIndex > 0) {
      const textBeforeTag = remainingContent.substring(0, matchIndex).trim();
      if (textBeforeTag) {
        matches.push({
          start: currentPosition,
          end: currentPosition + matchIndex,
          segment: { type: 'text', content: textBeforeTag }
        });
      }
    }
    
    const tagName = toolTagMatch[1].toLowerCase();
    
    if (tagName === 'thinking') {
      // Handle thinking tag specifically
      const thinkingClosingTag = '</thinking>';
      const closingTagIndex = remainingContent.indexOf(thinkingClosingTag, matchIndex);
      
      if (closingTagIndex !== -1) {
        const contentStartIndex = matchIndex + matchLength;
        const thinkingContent = remainingContent.substring(contentStartIndex, closingTagIndex).trim();
        
        matches.push({
          start: currentPosition + matchIndex,
          end: currentPosition + closingTagIndex + thinkingClosingTag.length,
          segment: { type: 'thinking', content: thinkingContent }
        });
        
        // Move past the closing tag
        const newPosition = closingTagIndex + thinkingClosingTag.length;
        currentPosition += newPosition;
        remainingContent = remainingContent.substring(newPosition);
      } else {
        // No closing tag found, treat as text
        currentPosition += matchIndex + matchLength;
        remainingContent = remainingContent.substring(matchIndex + matchLength);
      }
    } else {
      // Handle other tool tags
      // Find the corresponding closing tag
      const closingTagRegex = new RegExp(`<\\/${tagName}>`, 'i');
      const closingTagMatch = remainingContent.substring(matchIndex + matchLength).match(closingTagRegex);
      
      if (closingTagMatch && closingTagMatch.index !== undefined) {
        // Extract content between opening and closing tags
        const contentStartIndex = matchIndex + matchLength;
        const contentEndIndex = contentStartIndex + closingTagMatch.index;
        const toolContent = remainingContent.substring(contentStartIndex, contentEndIndex);
        
        // Create a ToolUseSegment with proper parameters
        matches.push({
          start: currentPosition + matchIndex,
          end: currentPosition + contentEndIndex + closingTagMatch[0].length,
          segment: {
            type: 'tool_use',
            toolName: tagName,
            parameters: { content: toolContent }
          }
        });
        
        // Also add a text segment for the tool content
        matches.push({
          start: currentPosition + contentStartIndex,
          end: currentPosition + contentEndIndex,
          segment: { type: 'text', content: toolContent }
        });
        
        // Move past the closing tag
        const newPosition = contentEndIndex + closingTagMatch[0].length;
        currentPosition += newPosition;
        remainingContent = remainingContent.substring(newPosition);
      } else {
        // No closing tag found, treat as text
        currentPosition += matchIndex + matchLength;
        remainingContent = remainingContent.substring(matchIndex + matchLength);
      }
    }
  }
  
  // Sort matches by their position in the text
  matches.sort((a, b) => a.start - b.start);
  
  // Process matches to create final segments list, removing duplicates and overlaps
  let lastEnd = 0;
  const processedPositions = new Set<number>();
  
  for (const match of matches) {
    // Skip if this segment has already been processed (for text segments that might overlap with tool content)
    if (processedPositions.has(match.start)) {
      continue;
    }
    
    // Mark this position as processed
    processedPositions.add(match.start);
    
    // Add the segment
    segments.push(match.segment);
    lastEnd = Math.max(lastEnd, match.end);
  }
  
  // If no segments were found, treat the entire content as a text segment
  if (segments.length === 0 && content.trim()) {
    segments.push({ type: 'text', content: content.trim() });
  }
  
  return segments;
}

/**
 * Parses a message string containing specific XML-like tags into an array of segments.
 * Handles <thinking>, <tool_name>, <question>, and <write_to_doc> tags.
 * Content outside these tags is treated as plain text.
 *
 * @param message The raw message string to parse.
 * @returns An array of MessageSegment objects.
 */
export function parseMessageWithTags(message: string): MessageSegment[] {


  const segments: MessageSegment[] = [];
  // Regex to find the specified tags or plain text sequences between them
  const tagRegex = /(<thinking>[\s\S]*?<\/thinking>|<tool_name>[\s\S]*?<\/tool_name>|<question>[\s\S]*?<\/question>|<write_to_doc>[\s\S]*?<\/write_to_doc>)/g;

  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(message)) !== null) {
    // Add preceding text if any
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: message.substring(lastIndex, match.index) });
    }

    // Extract tag type and content
    const fullMatch = match[0];
    // More specific regex to capture the tag name and content correctly
    const tagTypeMatch = fullMatch.match(/^<(\w+)>([\s\S]*)<\/\1>$/);

    if (tagTypeMatch && tagTypeMatch.length >= 3) {
      const type = tagTypeMatch[1];
      const content = tagTypeMatch[2];

      // Check if the extracted type is one of the allowed types
      if (['thinking', 'tool_name', 'question', 'write_to_doc'].includes(type)) {
         // Assert the type safely based on the check above
         segments.push({ type: type as MessageSegment['type'], content });
      } else {
         // If the tag is somehow matched but not one of the specified ones, treat it as text
         segments.push({ type: 'text', content: fullMatch });
      }
    } else {
       // This case should ideally not be reached if the main regex is correct,
       // but as a fallback, treat the matched string as text.
       segments.push({ type: 'text', content: fullMatch });
    }

    lastIndex = tagRegex.lastIndex;
  }

  // Add any remaining text after the last tag
  if (lastIndex < message.length) {
    segments.push({ type: 'text', content: message.substring(lastIndex) });
  }

  // Filter out empty text segments that might occur due to adjacent tags or leading/trailing whitespace
  return segments.filter(segment => !(segment.type === 'text' && segment.content.trim() === ''));
}
