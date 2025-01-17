import React from 'react';
import { Edit, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
}) => {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={onEdit}
        className="h-8 w-8"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="h-8 w-8"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );
};