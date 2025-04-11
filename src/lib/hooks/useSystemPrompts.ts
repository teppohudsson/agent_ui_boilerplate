import { useState, useEffect, useCallback } from 'react';
import { SystemPrompt } from '@/lib/types/chat';
import { createSystemPromptChangeEvent } from '@/lib/events/systemPromptEvents';

// Local storage key for system prompts
const STORAGE_KEY = 'system_prompts';
// Local storage key for active system prompt ID
const ACTIVE_PROMPT_KEY = 'active_system_prompt_id';

// Default system prompts
const defaultSystemPrompts: SystemPrompt[] = [
  {
    id: 'default-general',
    name: 'General Assistant',
    content: 'You are a helpful assistant. You provide clear, concise, and accurate information to the user\'s questions.',
    description: 'A general-purpose assistant that provides helpful responses.',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: true
  },
  {
    id: 'default-creative',
    name: 'Creative Writer',
    content: 'You are a creative writing assistant. You help users with storytelling, creative ideas, and writing techniques. Be imaginative and inspiring in your responses.',
    description: 'An assistant focused on creative writing and storytelling.',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: false
  },
  {
    id: 'default-code',
    name: 'Code Helper',
    content: 'You are a coding assistant. You help users with programming questions, debugging issues, and explaining technical concepts. Provide code examples when appropriate.',
    description: 'An assistant specialized in programming and technical help.',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: false
  },
  {
    id: 'default-learning',
    name: 'Learning Tutor',
    content: 'You are an educational tutor. You help users understand complex topics by breaking them down into simpler concepts. Provide examples and analogies to aid understanding.',
    description: 'An assistant that helps with learning and understanding complex topics.',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: false
  }
];

export function useSystemPrompts() {
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [activePromptId, setActivePromptId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load system prompts from local storage on initial load
  useEffect(() => {
    const loadSystemPrompts = () => {
      try {
        setLoading(true);
        
        // Try to get system prompts from local storage
        const storedPrompts = localStorage.getItem(STORAGE_KEY);
        const storedActivePromptId = localStorage.getItem(ACTIVE_PROMPT_KEY);
        
        if (storedPrompts) {
          // Parse stored prompts and convert string timestamps back to Date objects
          const parsedPrompts = JSON.parse(storedPrompts).map((prompt: any) => ({
            ...prompt,
            createdAt: new Date(prompt.createdAt),
            updatedAt: new Date(prompt.updatedAt)
          }));
          
          setSystemPrompts(parsedPrompts);
          
          // If there's a stored active prompt ID, use it
          if (storedActivePromptId) {
            setActivePromptId(storedActivePromptId);
          } else {
            // Otherwise, find the default prompt
            const defaultPrompt = parsedPrompts.find((p: SystemPrompt) => p.isDefault);
            if (defaultPrompt) {
              setActivePromptId(defaultPrompt.id);
            } else if (parsedPrompts.length > 0) {
              // If no default, use the first prompt
              setActivePromptId(parsedPrompts[0].id);
            }
          }
        } else {
          // If no stored prompts, use default prompts
          setSystemPrompts(defaultSystemPrompts);
          
          // Set the default prompt as active
          const defaultPrompt = defaultSystemPrompts.find(p => p.isDefault);
          if (defaultPrompt) {
            setActivePromptId(defaultPrompt.id);
          } else if (defaultSystemPrompts.length > 0) {
            setActivePromptId(defaultSystemPrompts[0].id);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load system prompts'));
        setLoading(false);
        
        // Fallback to defaults on error
        setSystemPrompts(defaultSystemPrompts);
        const defaultPrompt = defaultSystemPrompts.find(p => p.isDefault);
        if (defaultPrompt) {
          setActivePromptId(defaultPrompt.id);
        }
      }
    };

    loadSystemPrompts();

    // Listen for system prompt changes
    window.addEventListener('system-prompt-changed', loadSystemPrompts);

    // Clean up the event listener
    return () => {
      window.removeEventListener('system-prompt-changed', loadSystemPrompts);
    };
  }, []);

  // Save system prompts to local storage whenever they change
  useEffect(() => {
    if (systemPrompts.length > 0 && !loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(systemPrompts));
    }
  }, [systemPrompts, loading]);

  // Save active prompt ID to local storage whenever it changes
  useEffect(() => {
    if (activePromptId && !loading) {
      localStorage.setItem(ACTIVE_PROMPT_KEY, activePromptId);
    }
  }, [activePromptId, loading]);

  // Get the active system prompt object
  const getActivePrompt = useCallback((): SystemPrompt | undefined => {
    return systemPrompts.find(prompt => prompt.id === activePromptId);
  }, [systemPrompts, activePromptId]);

  // Create a new system prompt
  const createPrompt = useCallback((prompt: Omit<SystemPrompt, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPrompt: SystemPrompt = {
      ...prompt,
      id: `prompt-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setSystemPrompts(prev => {
      console.log('useSystemPrompts - createPrompt - previous prompts:', prev);
      const newPrompts = [...prev, newPrompt];
      console.log('useSystemPrompts - createPrompt - new prompts:', newPrompts);
      
      // Dispatch event to notify other components
      setTimeout(() => {
        const event = createSystemPromptChangeEvent({ systemPrompt: newPrompt });
        window.dispatchEvent(event);
      }, 0);
      
      return newPrompts;
    });
    
    // If this is the first prompt or it's set as default, make it active
    if (prompt.isDefault || systemPrompts.length === 0) {
      // If this prompt is set as default, update other prompts
      if (prompt.isDefault) {
        setSystemPrompts(prev => {
          const updatedPrompts = prev.map(p => ({
            ...p,
            isDefault: p.id === newPrompt.id
          }));
          
          // Dispatch event to notify other components
          setTimeout(() => {
            const event = createSystemPromptChangeEvent({ systemPrompt: newPrompt });
            window.dispatchEvent(event);
          }, 0);
          
          return updatedPrompts;
        });
      }
      setActivePromptId(newPrompt.id);
    }
    
    return newPrompt;
  }, [systemPrompts]);

  // Update an existing system prompt
  const updatePrompt = useCallback((id: string, updates: Partial<Omit<SystemPrompt, 'id' | 'createdAt'>>) => {
    setSystemPrompts(prev => {
      console.log('useSystemPrompts - updatePrompt - previous prompts:', prev);
      let updatedPrompt: SystemPrompt | null = null;
      
      const updatedPrompts = prev.map(prompt => {
        if (prompt.id === id) {
          // If this prompt is being set as default, update other prompts
          if (updates.isDefault) {
            updatedPrompt = {
              ...prompt,
              ...updates,
              updatedAt: new Date(),
              isDefault: true
            };
            return updatedPrompt;
          }
          
          updatedPrompt = {
            ...prompt,
            ...updates,
            updatedAt: new Date()
          };
          return updatedPrompt;
        }
        
        // If another prompt is being set as default, remove default from others
        if (updates.isDefault && prompt.isDefault) {
          return {
            ...prompt,
            isDefault: false
          };
        }
        
        return prompt;
      });
      
      // Dispatch event to notify other components
      if (updatedPrompt) {
        setTimeout(() => {
          const event = createSystemPromptChangeEvent({ systemPrompt: updatedPrompt });
          window.dispatchEvent(event);
        }, 0);
      }
      
      return updatedPrompts;
    });
    
    // If the updated prompt is set as default, make it active
    if (updates.isDefault) {
      setActivePromptId(id);
    }
  }, []);

  // Delete a system prompt
  const deletePrompt = useCallback((id: string) => {
    // Check if this is the active prompt
    const isActive = id === activePromptId;
    
    // Filter out the prompt to delete
    setSystemPrompts(prev => {
      console.log('useSystemPrompts - deletePrompt - previous prompts:', prev);
      const deletedPrompt = prev.find(prompt => prompt.id === id);
      const filteredPrompts = prev.filter(prompt => prompt.id !== id);
      
      // If we're deleting the active prompt, find a new active prompt
      if (isActive && filteredPrompts.length > 0) {
        // Try to find a default prompt
        const defaultPrompt = filteredPrompts.find(p => p.isDefault);
        if (defaultPrompt) {
          setActivePromptId(defaultPrompt.id);
        } else {
          // Otherwise use the first prompt
          setActivePromptId(filteredPrompts[0].id);
        }
      }
      
      // Dispatch event to notify other components
      if (deletedPrompt) {
        setTimeout(() => {
          const event = createSystemPromptChangeEvent({ systemPrompt: null });
          window.dispatchEvent(event);
        }, 0);
      }
      
      return filteredPrompts;
    });
  }, [activePromptId]);

  // Set a prompt as the active prompt
  const setActivePrompt = useCallback((id: string) => {
    const promptExists = systemPrompts.some(prompt => prompt.id === id);
    if (promptExists) {
      setActivePromptId(id);
    } else {
      console.error(`Prompt with ID ${id} does not exist`);
      
      // Fallback to a default prompt
      const defaultPrompt = systemPrompts.find(p => p.isDefault);
      if (defaultPrompt) {
        setActivePromptId(defaultPrompt.id);
      } else if (systemPrompts.length > 0) {
        setActivePromptId(systemPrompts[0].id);
      }
    }
  }, [systemPrompts]);

  // Set a prompt as the default
  const setDefaultPrompt = useCallback((id: string) => {
    updatePrompt(id, { isDefault: true });
    
    // No need to dispatch event here as updatePrompt will do it
  }, [updatePrompt]);

  // Reset to default system prompts
  const resetToDefaults = useCallback(() => {
    setSystemPrompts(defaultSystemPrompts);
    const defaultPrompt = defaultSystemPrompts.find(p => p.isDefault);
    if (defaultPrompt) {
      setActivePromptId(defaultPrompt.id);
    }
    
    // Dispatch event to notify other components
    setTimeout(() => {
      const event = createSystemPromptChangeEvent({ systemPrompt: defaultPrompt || null });
      window.dispatchEvent(event);
    }, 0);
  }, []);

  return {
    systemPrompts,
    activePromptId,
    loading,
    error,
    getActivePrompt,
    createPrompt,
    updatePrompt,
    deletePrompt,
    setActivePrompt,
    setDefaultPrompt,
    resetToDefaults
  };
}