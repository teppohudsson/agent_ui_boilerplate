import { SystemPrompt } from '@/lib/types/chat';

export interface SystemPromptChangeEventDetail {
  systemPrompt: SystemPrompt | null; // Can be null when a prompt is deleted
}

export const SYSTEM_PROMPT_CHANGED_EVENT_NAME = 'system-prompt-changed';

export const createSystemPromptChangeEvent = (detail: SystemPromptChangeEventDetail) => {
  return new CustomEvent(SYSTEM_PROMPT_CHANGED_EVENT_NAME, {
    bubbles: true,
    cancelable: true,
    detail,
  });
};
