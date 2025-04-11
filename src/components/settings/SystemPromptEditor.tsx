import { FC, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';
import { SystemPrompt } from '@/lib/types/chat';
import { useSystemPrompts } from '@/lib/hooks/useSystemPrompts';

interface SystemPromptEditorProps {
  prompt: SystemPrompt | null; // null for creating new, SystemPrompt for editing
  onClose: () => void;
}

const SystemPromptEditor: FC<SystemPromptEditorProps> = ({ prompt, onClose }) => {
  const { createPrompt, updatePrompt } = useSystemPrompts();
  
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    content?: string;
  }>({});

  // Initialize form with prompt data if editing
  useEffect(() => {
    if (prompt) {
      setName(prompt.name);
      setContent(prompt.content);
      setDescription(prompt.description || '');
      setIsDefault(prompt.isDefault || false);
    } else {
      // Default values for new prompt
      setName('');
      setContent('');
      setDescription('');
      setIsDefault(false);
    }
  }, [prompt]);

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      content?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (prompt) {
      // Update existing prompt
      updatePrompt(prompt.id, {
        name,
        content,
        description: description || undefined,
        isDefault
      });
    } else {
      // Create new prompt
      createPrompt({
        name,
        content,
        description: description || undefined,
        isDefault
      });
    }

    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="prompt-name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="prompt-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Professional Assistant"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="prompt-description" className="text-sm font-medium">
          Description (optional)
        </label>
        <Input
          id="prompt-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., A professional assistant for business inquiries"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="prompt-content" className="text-sm font-medium">
          System Prompt Content
        </label>
        <TextArea
          id="prompt-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="e.g., You are a professional assistant. You provide concise, accurate information with a formal tone..."
          className={`min-h-[150px] ${errors.content ? 'border-destructive' : ''}`}
        />
        {errors.content && (
          <p className="text-xs text-destructive">{errors.content}</p>
        )}
        <p className="text-xs text-muted-foreground">
          The system prompt sets the behavior and personality of the AI assistant.
          It's sent at the beginning of each conversation.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="prompt-default"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="prompt-default" className="text-sm">
          Set as default system prompt
        </label>
      </div>

      <div className="pt-4 flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {prompt ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );
};

export default SystemPromptEditor;