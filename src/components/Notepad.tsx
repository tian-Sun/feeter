import React, { useState, useEffect } from 'react';
import { Paper, TextField, Box } from '@mui/material';

const Notepad: React.FC = () => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = event.target.value;
    setNotes(newNotes);
    localStorage.setItem('notes', newNotes);
  };

  return (
    <Paper 
      sx={{ 
        p: 2,
        mt: 2,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fffef7',
        minHeight: '333px', // 原来500px的2/3
        maxHeight: 'calc((100vh - 250px) * 0.67)', // 原来高度的2/3
        overflow: 'hidden'
      }}
    >
      <TextField
        multiline
        fullWidth
        placeholder="在这里记录你的想法..."
        value={notes}
        onChange={handleNotesChange}
        variant="standard"
        sx={{
          flex: 1,
          '& .MuiInputBase-root': {
            height: '100%',
            alignItems: 'flex-start',
            fontSize: '1rem',
            lineHeight: 1.6
          },
          '& .MuiInputBase-input': {
            height: '100% !important',
            overflow: 'auto !important',
            padding: '4px 8px'
          }
        }}
        InputProps={{
          disableUnderline: true,
        }}
      />
    </Paper>
  );
};

export default Notepad; 