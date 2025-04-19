export type ChatSegment = TextSegment | ToolUseSegment | ToolResultSegment | ThinkingSegment;

export interface TextSegment {
  type: 'text';
  content: string;
}

export interface ToolUseSegment {
  type: 'tool_use';
  toolName: string;
  parameters: any; // You might want to define a more specific type for parameters
}

export interface ToolResultSegment {
  type: 'tool_result';
  toolName: string;
  result: any; // Define a more specific type based on tool outputs
}

export interface ThinkingSegment {
  type: 'thinking';
  content: string;
}