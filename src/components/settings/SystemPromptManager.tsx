import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSystemPrompts } from '@/lib/hooks/useSystemPrompts';
import { SystemPrompt } from '@/lib/types/chat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Check, RefreshCw } from 'lucide-react';
// @ts-ignore
import SystemPromptEditor from './SystemPromptEditor';

interface SystemPromptManagerProps {
  className?: string;
}

const SystemPromptManager: FC<SystemPromptManagerProps> = ({ className }) => {
  const {
    systemPrompts,
    activePromptId,
    setActivePrompt,
    setDefaultPrompt,
    deletePrompt,
    resetToDefaults
  } = useSystemPrompts();

  console.log('SystemPromptManager - initial systemPrompts:', systemPrompts);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<SystemPrompt | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleEditPrompt = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setIsEditorOpen(true);
  };

  const handleCreatePrompt = () => {
    setEditingPrompt(null);
    setIsEditorOpen(true);
  };

  const handleDeletePrompt = (prompt: SystemPrompt) => {
    setPromptToDelete(prompt);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePrompt = () => {
    if (promptToDelete) {
      deletePrompt(promptToDelete.id);
      setIsDeleteDialogOpen(false);
      setPromptToDelete(null);
    }
  };

  const handleResetToDefaults = () => {
    setIsResetDialogOpen(true);
  };

  const confirmResetToDefaults = () => {
    resetToDefaults();
    setIsResetDialogOpen(false);
  };

  const handleSetActive = (promptId: string) => {
    setActivePrompt(promptId);
  };

  const handleSetDefault = (promptId: string) => {
    setDefaultPrompt(promptId);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingPrompt(null);
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">System Prompts</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            title="Reset to default prompts"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreatePrompt}
            title="Create new prompt"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {systemPrompts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No system prompts found. Create one or reset to defaults.
          </p>
        ) : (
          systemPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className={`p-3 rounded-md border ${
                activePromptId === prompt.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium text-sm">{prompt.name}</h4>
                    {prompt.isDefault && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {prompt.description || 'No description'}
                  </p>
                </div>
                <div className="flex space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleEditPrompt(prompt)}
                    title="Edit prompt"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDeletePrompt(prompt)}
                    title="Delete prompt"
                    disabled={systemPrompts.length === 1} // Prevent deleting the last prompt
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex space-x-2">
                <Button
                  variant={prompt.isDefault ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleSetDefault(prompt.id)}
                  disabled={prompt.isDefault}
                >
                  {prompt.isDefault ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Default
                    </>
                  ) : (
                    'Set as Default'
                  )}
                </Button>
              </div>
              <div className="mt-2">
                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                  "{prompt.content.substring(0, 100)}
                  {prompt.content.length > 100 ? '...' : ''}"
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* System Prompt Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? 'Edit System Prompt' : 'Create System Prompt'}
            </DialogTitle>
          </DialogHeader>
          <SystemPromptEditor
            prompt={editingPrompt}
            onClose={closeEditor}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete System Prompt</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete the system prompt "{promptToDelete?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-4">
            <DialogClose className="transition-colors h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50">
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDeletePrompt}
              className="transition-colors"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset to Default Prompts</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            This will replace all your custom system prompts with the default ones. Any custom prompts you've created will be lost. Are you sure you want to continue?
          </p>
          <div className="flex justify-end gap-4">
            <DialogClose className="transition-colors h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50">
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmResetToDefaults}
              className="transition-colors"
            >
              Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SystemPromptManager;