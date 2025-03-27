import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay,
  useSensor, 
  useSensors, 
  PointerSensor,
  DragStartEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
  pointerWithin,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Box, Grid, Paper, Typography, TextField, IconButton } from '@mui/material';
import { Edit as EditIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { Task, Quadrant } from '../types';
import TaskItem from './TaskItem';
import PomodoroTimer from './PomodoroTimer';
import Notepad from './Notepad';

const defaultQuadrants: Quadrant[] = [
  { id: '1', title: '重要且紧急', tasks: [] },
  { id: '2', title: '重要不紧急', tasks: [] },
  { id: '3', title: '紧急不重要', tasks: [] },
  { id: '4', title: '不重要不紧急', tasks: [] },
];

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

const QuadrantBoard: React.FC = () => {
  const [quadrants, setQuadrants] = useState<Quadrant[]>(() => {
    const saved = localStorage.getItem('quadrants');
    return saved ? JSON.parse(saved) : defaultQuadrants;
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTaskInputs, setNewTaskInputs] = useState<{ [key: string]: string }>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    localStorage.setItem('quadrants', JSON.stringify(quadrants));
  }, [quadrants]);

  // 初始化每个象限的输入状态
  useEffect(() => {
    const inputs: { [key: string]: string } = {};
    quadrants.forEach(q => {
      inputs[q.id] = '';
    });
    setNewTaskInputs(inputs);
  }, []);

  const findContainer = (id: string) => {
    // 如果是象限容器ID
    if (id.startsWith('quadrant-')) {
      return id.split('-')[1];
    }

    // 如果是任务ID，查找它所在的象限
    for (const quadrant of quadrants) {
      if (quadrant.tasks.some(task => task.id === id)) {
        return quadrant.id;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    try {
      const { active } = event;
      setActiveId(active.id.toString());
      
      const task = quadrants
        .flatMap(q => q.tasks)
        .find(t => t.id === active.id.toString());
      
      if (task) {
        setActiveTask(task);
      }
    } catch (error) {
      console.error('Drag start error:', error);
      setActiveId(null);
      setActiveTask(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    try {
      const { active, over } = event;
      
      if (!over) {
        setActiveId(null);
        setActiveTask(null);
        return;
      }

      const activeId = active.id.toString();
      const overId = over.id.toString();
      
      const sourceQuadrant = quadrants.find(q => q.tasks.some(t => t.id === activeId));
      const targetQuadrant = quadrants.find(q => q.id === overId);
      
      if (sourceQuadrant && targetQuadrant) {
        setQuadrants(prev => prev.map(quadrant => {
          if (quadrant.id === sourceQuadrant.id) {
            return {
              ...quadrant,
              tasks: quadrant.tasks.filter(t => t.id !== activeId)
            };
          }
          if (quadrant.id === targetQuadrant.id) {
            const task = sourceQuadrant.tasks.find(t => t.id === activeId);
            if (task) {
              return {
                ...quadrant,
                tasks: [...quadrant.tasks, { ...task, quadrantId: targetQuadrant.id }]
              };
            }
          }
          return quadrant;
        }));
      }
    } catch (error) {
      console.error('Drag end error:', error);
    } finally {
      setActiveId(null);
      setActiveTask(null);
    }
  };

  const handleAddTask = (quadrantId: string, title: string) => {
    if (!title.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: title.trim(),
      completed: false,
      quadrantId
    };

    setQuadrants(prev =>
      prev.map(quadrant =>
        quadrant.id === quadrantId
          ? { ...quadrant, tasks: [...quadrant.tasks, newTask] }
          : quadrant
      )
    );
  };

  const handleDeleteTask = (quadrantId: string, taskId: string) => {
    setQuadrants(prev =>
      prev.map(quadrant =>
        quadrant.id === quadrantId
          ? { ...quadrant, tasks: quadrant.tasks.filter(task => task.id !== taskId) }
          : quadrant
      )
    );
  };

  const handleToggleComplete = (quadrantId: string, taskId: string) => {
    setQuadrants(prev =>
      prev.map(quadrant =>
        quadrant.id === quadrantId
          ? {
              ...quadrant,
              tasks: quadrant.tasks.map(task =>
                task.id === taskId
                  ? { ...task, completed: !task.completed }
                  : task
              ),
            }
          : quadrant
      )
    );
  };

  const handleTaskTitleChange = (quadrantId: string, taskId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    setQuadrants(prev =>
      prev.map(quadrant =>
        quadrant.id === quadrantId
          ? {
              ...quadrant,
              tasks: quadrant.tasks.map(task =>
                task.id === taskId
                  ? { ...task, title: newTitle.trim() }
                  : task
              ),
            }
          : quadrant
      )
    );
  };

  const handleStartTitleEdit = (quadrant: Quadrant) => {
    setEditingTitleId(quadrant.id);
    setEditingTitle(quadrant.title);
  };

  const handleSaveTitle = (quadrantId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setQuadrants(prev =>
      prev.map(q =>
        q.id === quadrantId
          ? { ...q, title: newTitle.trim() }
          : q
      )
    );
    setEditingTitleId(null);
    setEditingTitle('');
  };

  const handleCancelTitleEdit = () => {
    setEditingTitleId(null);
    setEditingTitle('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, quadrantId: string) => {
    if (e.key === 'Enter') {
      handleSaveTitle(quadrantId, editingTitle);
    } else if (e.key === 'Escape') {
      handleCancelTitleEdit();
    }
  };

  const DroppableQuadrant = ({ quadrant, children }: { quadrant: Quadrant; children: React.ReactNode }) => {
    const { setNodeRef } = useDroppable({
      id: quadrant.id,
    });

    const [newTaskTitle, setNewTaskTitle] = useState('');

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (newTaskTitle.trim()) {
          handleAddTask(quadrant.id, newTaskTitle);
          setNewTaskTitle('');
        }
      }
    };

    return (
      <Paper
        ref={setNodeRef}
        elevation={3}
        sx={{
          p: 2,
          height: '100%',
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {editingTitleId === quadrant.id ? (
          <TextField
            fullWidth
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => handleTitleKeyDown(e, quadrant.id)}
            onBlur={() => handleSaveTitle(quadrant.id, editingTitle)}
            autoFocus
            size="small"
            sx={{ mb: 2 }}
          />
        ) : (
          <Typography
            variant="h6"
            onClick={() => handleStartTitleEdit(quadrant)}
            sx={{
              mb: 2,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            {quadrant.title}
          </Typography>
        )}
        <TextField
          fullWidth
          size="small"
          placeholder="添加新任务"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ mb: 2 }}
        />
        {children}
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <DndContext 
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Grid container spacing={2}>
              {quadrants.map((quadrant) => (
                <Grid item xs={6} key={quadrant.id}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      minHeight: '200px',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <Box sx={{ mb: 2 }}>
                      <DroppableQuadrant quadrant={quadrant}>
                        {quadrant.tasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onDelete={() => handleDeleteTask(quadrant.id, task.id)}
                            onToggleComplete={() => handleToggleComplete(quadrant.id, task.id)}
                            onTitleChange={(taskId, newTitle) => handleTaskTitleChange(quadrant.id, taskId, newTitle)}
                            isDragging={activeId === task.id}
                          />
                        ))}
                      </DroppableQuadrant>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <DragOverlay dropAnimation={dropAnimation}>
              {activeTask ? (
                <TaskItem
                  task={activeTask}
                  onDelete={() => {}}
                  onToggleComplete={() => {}}
                  onTitleChange={() => {}}
                  isDragging={true}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </Box>
        <Box sx={{ 
          width: '400px', 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 'calc(100vh - 32px)', // 减去 padding
        }}>
          <PomodoroTimer />
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Notepad />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default QuadrantBoard; 