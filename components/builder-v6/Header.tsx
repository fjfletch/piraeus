import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Rocket, Save } from 'lucide-react';

interface HeaderProps {
  onSave: () => void;
  onDeploy: () => void;
  isSaving?: boolean;
}

export function Header({ onSave, onDeploy, isSaving }: HeaderProps) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background">
      {/* Left side - Project name */}
      <div className="flex items-center gap-4">
        <Input
          defaultValue="Untitled Project"
          className="max-w-xs"
          placeholder="Project name"
        />
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
        <Button size="sm" onClick={onDeploy}>
          <Rocket className="h-4 w-4 mr-2" />
          Publish
        </Button>
      </div>
    </header>
  );
}
