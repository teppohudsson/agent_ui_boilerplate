import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
