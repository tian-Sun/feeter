import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Paper, Typography, IconButton, Checkbox, TextField } from '@mui/material';
import { Delete as DeleteIcon, DragIndicator } from '@mui/icons-material';
import { Task } from '../types';

export interface TaskItemProps {
  task: Task;
  onDelete: () => void;
  onToggleComplete: () => void;
  onTitleChange?: (newTitle: string) => void;
  isDragging?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onDelete, 
  onToggleComplete, 
  onTitleChange,
  isDragging = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(task.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : undefined,
    cursor: 'grab',
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingTitle(task.title);
  };

  const handleSave = () => {
    if (editingTitle.trim() && onTitleChange) {
      onTitleChange(editingTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingTitle(task.title);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        p: 1,
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: isDragging ? 'action.hover' : 'background.paper',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
      {...attributes}
      {...listeners}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: 'text.secondary',
          '&:hover': { color: 'primary.main' }
        }}
      >
        <DragIndicator fontSize="small" />
      </Box>
      <Checkbox
        checked={task.completed}
        onChange={onToggleComplete}
        size="small"
        sx={{ mr: 1 }}
        onClick={(e) => e.stopPropagation()}
      />
      <Box sx={{ flex: 1 }}>
        {isEditing ? (
          <TextField
            fullWidth
            size="small"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            onBlur={handleSave}
            autoFocus
            variant="standard"
            onClick={(e) => e.stopPropagation()}
            sx={{
              '& .MuiInput-root': {
                fontSize: '0.875rem',
              }
            }}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? 'text.secondary' : 'text.primary',
              cursor: 'text',
              userSelect: 'none',
              py: 0.5,
            }}
            onDoubleClick={handleStartEdit}
          >
            {task.title}
          </Typography>
        )}
      </Box>
      <IconButton 
        size="small" 
        onClick={handleDeleteClick}
        sx={{ 
          '&:hover': { 
            color: 'error.main',
            backgroundColor: 'error.light' 
          } 
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
};

export default TaskItem; 