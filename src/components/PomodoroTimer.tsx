import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, IconButton } from '@mui/material';
import { PlayArrow, Pause, Stop, Timer } from '@mui/icons-material';

interface PomodoroTimerProps {
  workDuration?: number; // 工作时长（分钟）
  breakDuration?: number; // 休息时长（分钟）
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  workDuration = 25,
  breakDuration = 5
}) => {
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkMode, setIsWorkMode] = useState(true);
  const [cycles, setCycles] = useState(0);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // 播放提示音
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {
        console.log('无法播放提示音');
      });

      // 切换模式
      setIsWorkMode(prev => !prev);
      setTimeLeft(isWorkMode ? breakDuration * 60 : workDuration * 60);
      setIsRunning(false);
      
      if (isWorkMode) {
        setCycles(prev => prev + 1);
      }
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, isWorkMode, workDuration, breakDuration]);

  // 更新标签页标题
  useEffect(() => {
    const timeString = formatTime(timeLeft);
    const modeText = isWorkMode ? '专注' : '休息';
    document.title = isRunning ? `⏱ ${timeString} - ${modeText}中` : 'FocusBoard';
  }, [timeLeft, isRunning, isWorkMode]);

  const handleStartPause = () => {
    setIsRunning(prev => !prev);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(workDuration * 60);
    setIsWorkMode(true);
    document.title = 'FocusBoard';
  };

  return (
    <Paper 
      sx={{ 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: isWorkMode ? '#fff3e0' : '#e3f2fd',
        transition: 'background-color 0.3s'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Timer sx={{ mr: 1 }} />
        <Typography variant="h6">
          {isWorkMode ? '专注时间' : '休息时间'}
        </Typography>
      </Box>
      
      <Typography 
        variant="h3" 
        sx={{ 
          fontFamily: 'monospace',
          fontWeight: 'bold',
          mb: 2
        }}
      >
        {formatTime(timeLeft)}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <IconButton 
          onClick={handleStartPause}
          color="primary"
          size="small"
        >
          {isRunning ? <Pause /> : <PlayArrow />}
        </IconButton>
        <IconButton 
          onClick={handleStop}
          color="error"
          size="small"
        >
          <Stop />
        </IconButton>
      </Box>

      <Typography variant="body2" color="text.secondary">
        已完成 {cycles} 个番茄钟
      </Typography>
    </Paper>
  );
};

export default PomodoroTimer; 