import React, { useState } from 'react';
import { Typography, IconButton, Box, TextField } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  quadrantId: string;
}

interface TaskItemProps {
  task: Task;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onTitleChange: (id: string, newTitle: string) => void;
  isDragging?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onDelete,
  onToggleComplete,
  onTitleChange,
  isDragging = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(task.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingTitle(task.title);
  };

  const handleSave = () => {
    if (editingTitle.trim()) {
      onTitleChange(task.id, editingTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingTitle(task.title);
    }
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1,
        borderRadius: 1,
        bgcolor: 'background.paper',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        userSelect: 'none',
      }}
    >
      <Box {...attributes} {...listeners} sx={{ cursor: 'grab', mr: 1 }}>
        <DragIndicatorIcon />
      </Box>
      {isEditing ? (
        <TextField
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          size="small"
          fullWidth
          autoFocus
          sx={{ flex: 1 }}
        />
      ) : (
        <Typography
          onDoubleClick={handleStartEdit}
          sx={{
            flex: 1,
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? 'text.disabled' : 'text.primary',
            cursor: 'text',
          }}
        >
          {task.title}
        </Typography>
      )}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        size="small"
        sx={{ ml: 1 }}
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};

export default TaskItem; 