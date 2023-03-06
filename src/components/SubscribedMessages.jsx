import React, { useMemo } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';

const STYLES = {
  messages: {
    marginTop: 1/2,
    height: 'calc(50vh - (8px + 32px))',
    overflowY: 'scroll',
  },
  textBox: {
    padding: 1/2,
    border: '1px solid black',
    marginBottom: 2,
    '& pre': {
      font: 'inherit',
      marginY: 1/2,
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word'
    }
  },
  textArea: {
    border: 'none',
    fontSize: '0.875rem'
  }
}

export function SubscribedMessages ({ messages }) {
  return (
    <ScopedCssBaseline>
      <Box
        sx={STYLES.messages}
      >
        {messages.map(logs => (
          <Box sx={STYLES.textBox} data-ref="debug.subscribed.message">
            {logs.map(log => (
              <Typography variant="body2" >
                <pre>{log}</pre>
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
    </ScopedCssBaseline>
  )
}
