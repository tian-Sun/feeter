import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay,
  useSensor, 
  useSensors, 
  MouseSensor, 
  TouchSensor,
  DragOverEvent,
  UniqueIdentifier,
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
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [newTaskInputs, setNewTaskInputs] = useState<{ [key: string]: string }>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 8,
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

  const findContainer = (id: UniqueIdentifier) => {
    // 如果是象限容器ID
    if (id.toString().startsWith('quadrant-')) {
      return id.toString().split('-')[1];
    }

    // 如果是任务ID，查找它所在的象限
    for (const quadrant of quadrants) {
      if (quadrant.tasks.some(task => task.id === id.toString())) {
        return quadrant.id;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    const task = findTask(active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    let overContainer = findContainer(over.id);
    
    if (!activeContainer) return;

    // 如果拖到了空象限
    if (!overContainer) {
      const overId = over.id.toString();
      if (overId.startsWith('quadrant-')) {
        overContainer = overId.split('-')[1];
      }
    }
    
    if (!overContainer || activeContainer === overContainer) {
      return;
    }

    setQuadrants(prev => {
      const activeTask = findTask(active.id);
      if (!activeTask) return prev;

      return prev.map(quadrant => {
        if (quadrant.id === activeContainer) {
          return {
            ...quadrant,
            tasks: quadrant.tasks.filter(task => task.id !== active.id.toString())
          };
        }
        if (quadrant.id === overContainer) {
          const updatedTask = { ...activeTask, quadrantId: overContainer };
          return {
            ...quadrant,
            tasks: [...quadrant.tasks, updatedTask]
          };
        }
        return quadrant;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setActiveTask(null);
      return;
    }

    const activeContainer = findContainer(active.id);
    let overContainer = findContainer(over.id);

    if (!activeContainer) {
      setActiveId(null);
      setActiveTask(null);
      return;
    }

    // 如果拖到了空象限
    if (!overContainer) {
      const overId = over.id.toString();
      if (overId.startsWith('quadrant-')) {
        overContainer = overId.split('-')[1];
      }
    }

    if (!overContainer) {
      setActiveId(null);
      setActiveTask(null);
      return;
    }

    if (activeContainer !== overContainer) {
      setQuadrants(prev => {
        const activeTask = findTask(active.id);
        if (!activeTask) return prev;

        const updatedTask = { ...activeTask, quadrantId: overContainer };

        return prev.map(quadrant => {
          if (quadrant.id === activeContainer) {
            return {
              ...quadrant,
              tasks: quadrant.tasks.filter(task => task.id !== active.id.toString())
            };
          }
          if (quadrant.id === overContainer) {
            return {
              ...quadrant,
              tasks: [...quadrant.tasks, updatedTask]
            };
          }
          return quadrant;
        });
      });
    } else {
      const items = quadrants.find(q => q.id === activeContainer)?.tasks || [];
      const oldIndex = items.findIndex(item => item.id === active.id.toString());
      const newIndex = items.findIndex(item => item.id === over.id.toString());

      if (oldIndex !== -1 && newIndex !== -1) {
        setQuadrants(prev =>
          prev.map(quadrant => {
            if (quadrant.id === activeContainer) {
              return {
                ...quadrant,
                tasks: arrayMove(quadrant.tasks, oldIndex, newIndex)
              };
            }
            return quadrant;
          })
        );
      }
    }

    setActiveId(null);
    setActiveTask(null);
  };

  const findTask = (taskId: UniqueIdentifier): Task | undefined => {
    for (const quadrant of quadrants) {
      const task = quadrant.tasks.find(t => t.id === taskId.toString());
      if (task) return task;
    }
    return undefined;
  };

  const handleAddTask = (quadrantId: string, event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && newTaskInputs[quadrantId].trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTaskInputs[quadrantId].trim(),
        completed: false,
        quadrantId: quadrantId,
      };

      setQuadrants(quadrants.map(q => 
        q.id === quadrantId 
          ? { ...q, tasks: [...q.tasks, task] }
          : q
      ));

      // 清空输入
      setNewTaskInputs({
        ...newTaskInputs,
        [quadrantId]: ''
      });
    }
  };

  const handleDeleteTask = (taskId: string, quadrantId: string) => {
    setQuadrants(quadrants.map(q => 
      q.id === quadrantId 
        ? { ...q, tasks: q.tasks.filter(t => t.id !== taskId) }
        : q
    ));
  };

  const handleToggleComplete = (taskId: string, quadrantId: string) => {
    setQuadrants(quadrants.map(q => 
      q.id === quadrantId 
        ? {
            ...q,
            tasks: q.tasks.map(t =>
              t.id === taskId ? { ...t, completed: !t.completed } : t
            )
          }
        : q
    ));
  };

  const handleStartTitleEdit = (quadrant: Quadrant) => {
    setEditingTitleId(quadrant.id);
    setEditingTitle(quadrant.title);
  };

  const handleSaveTitle = () => {
    if (editingTitleId && editingTitle.trim()) {
      setQuadrants(quadrants.map(q =>
        q.id === editingTitleId ? { ...q, title: editingTitle.trim() } : q
      ));
      setEditingTitleId(null);
      setEditingTitle('');
    }
  };

  const handleCancelTitleEdit = () => {
    setEditingTitleId(null);
    setEditingTitle('');
  };

  const DroppableQuadrant = ({ quadrant, children }: { quadrant: Quadrant; children: React.ReactNode }) => {
    const { setNodeRef } = useDroppable({
      id: `quadrant-${quadrant.id}`,
    });

    return (
      <Box 
        ref={setNodeRef}
        id={`quadrant-${quadrant.id}`}
        sx={{ 
          minHeight: '100px',
          padding: 1,
          transition: 'all 0.2s ease',
          backgroundColor: activeId && quadrant.tasks.length === 0 ? 'action.hover' : 'transparent',
          border: activeId ? '2px dashed #ccc' : 'none',
          borderRadius: 1,
        }}
      >
        <SortableContext 
          items={quadrant.tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {children}
        </SortableContext>
      </Box>
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
            onDragOver={handleDragOver}
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
                      {editingTitleId === quadrant.id ? (
                        <TextField
                          size="small"
                          fullWidth
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveTitle();
                            } else if (e.key === 'Escape') {
                              handleCancelTitleEdit();
                            }
                          }}
                          onBlur={handleSaveTitle}
                          autoFocus
                          variant="standard"
                          sx={{
                            mb: 1,
                            '& .MuiInput-root': {
                              fontSize: '1.25rem',
                              fontWeight: 500
                            }
                          }}
                        />
                      ) : (
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            mb: 1,
                            cursor: 'text',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                          onClick={() => handleStartTitleEdit(quadrant)}
                        >
                          {quadrant.title}
                        </Typography>
                      )}
                      <TextField
                        size="small"
                        placeholder="添加新任务，按回车保存"
                        fullWidth
                        value={newTaskInputs[quadrant.id] || ''}
                        onChange={(e) => setNewTaskInputs({
                          ...newTaskInputs,
                          [quadrant.id]: e.target.value
                        })}
                        onKeyPress={(e) => handleAddTask(quadrant.id, e)}
                      />
                    </Box>
                    <DroppableQuadrant quadrant={quadrant}>
                      {quadrant.tasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onDelete={() => handleDeleteTask(task.id, quadrant.id)}
                          onToggleComplete={() => handleToggleComplete(task.id, quadrant.id)}
                          onTitleChange={(newTitle) => {
                            setQuadrants(quadrants.map(q =>
                              q.id === quadrant.id
                                ? {
                                    ...q,
                                    tasks: q.tasks.map(t =>
                                      t.id === task.id
                                        ? { ...t, title: newTitle }
                                        : t
                                    )
                                  }
                                : q
                            ));
                          }}
                          isDragging={activeId === task.id}
                        />
                      ))}
                    </DroppableQuadrant>
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