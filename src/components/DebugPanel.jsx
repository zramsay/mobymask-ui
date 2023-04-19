import React from "react";
import throttle from 'lodash/throttle';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Fab from '@mui/material/Fab';
import Popper from '@mui/material/Popper';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import BugReportIcon from '@mui/icons-material/BugReport';
import CloseIcon from '@mui/icons-material/Close';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Metrics, SelfInfo, Connections, PeersGraph, NetworkGraph } from "@cerc-io/react-peer";

import config from '../utils/config.json';
import { SubscribedMessages } from './SubscribedMessages';
import { TabPanel } from './TabPanel';

const RESIZE_THROTTLE_TIME = 500; // ms
const TAB_HEADER_HEIGHT = 40;

const STYLES = {
  debugFabStyle: {
    position: 'fixed',
    bottom: 16,
    right: 16,
  },
  closeFabStyle: {
    position: 'absolute',
    top: 8,
    right: 8
  },
  popper: {
    textAlign: 'left',
    width: 'calc(100% - 32px)',
    zIndex: 2
  },
  popperPaper: {
    overflow: "auto",
    padding: 1 / 2,
    marginBottom: "-56px",
    height: "50vh",
    border: "4px double black"
  },
  tabsBox: {
    borderBottom: 1,
    borderColor: 'divider'
  },
  tabsList: {
    minHeight: 32
  },
  tab: {
    paddingY: 1/2,
    minHeight: 32
  },
  tabPanel: {
    paddingTop: 1/2
  },
  selfInfo: {
    marginBottom: 1
  }
}

const theme = createTheme({
  components: {
    MuiTableCell: {
      styleOverrides: {
        sizeSmall: {
          padding: "4px",
          border: '1px solid black'
        },
      },
    }
  },
});

export default function DebugPanel({ messages }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [value, setValue] = React.useState('1');
  const [graphContainerHeight, setGraphContainerHeight] = React.useState((window.innerHeight / 2) - TAB_HEADER_HEIGHT)

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const throttledHandleWindowResize = React.useMemo(
    () => throttle(() => {
      setGraphContainerHeight((window.innerHeight / 2) - TAB_HEADER_HEIGHT)
    }, RESIZE_THROTTLE_TIME),
    []
  );

  React.useEffect(() => {
    window.addEventListener('resize', throttledHandleWindowResize);

    return () => {
      window.removeEventListener('resize', throttledHandleWindowResize);
    };
  }, [throttledHandleWindowResize]);

  return (
    <ThemeProvider theme={theme}>
      <Box height={Boolean(anchorEl) ? '50vh' : 0} />
      <Popper
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        placement="top-end"
        keepMounted
        sx={STYLES.popper}
        disablePortal
      >
        <Paper
          variant="outlined"
          sx={STYLES.popperPaper}
        >
          <Fab
            onClick={() => setAnchorEl(null)}
            sx={STYLES.closeFabStyle}
            aria-label="close"
            size="small"
            data-ref="debug.close"
          >
            <CloseIcon />
          </Fab>
          <TabContext value={value}>
            <Box sx={STYLES.tabsBox}>
              <TabList sx={STYLES.tabsList} onChange={handleChange} aria-label="debug panel tabs">
                <Tab sx={STYLES.tab} label="Peers" value="1" />
                <Tab sx={STYLES.tab} label="Metrics" value="2" />
                <Tab sx={STYLES.tab} label="Graph (Peers)" value="3" />
                <Tab sx={STYLES.tab} label="Messages" value="4" data-ref="debug.messages" />
                <Tab disabled={!config.peer.enableDebugInfo} sx={STYLES.tab} label="Graph (Network)" value="5" />
              </TabList>
            </Box>
            <TabPanel sx={STYLES.tabPanel} value="1">
              <SelfInfo relayNodes={config.relayNodes ?? []} sx={STYLES.selfInfo} />
              <Connections />
            </TabPanel>
            <TabPanel sx={STYLES.tabPanel} value="2">
              <Metrics />
            </TabPanel>
            <TabPanel sx={STYLES.tabPanel} value="3">
              <PeersGraph containerHeight={graphContainerHeight}/>
            </TabPanel>
            <TabPanel sx={STYLES.tabPanel} value="4">
              <SubscribedMessages messages={messages} />
            </TabPanel>
            <TabPanel sx={STYLES.tabPanel} value="5">
              <NetworkGraph containerHeight={graphContainerHeight}/>
            </TabPanel>
          </TabContext>
        </Paper>
      </Popper>
      <Fab
        color="primary"
        onClick={event => setAnchorEl(event.currentTarget)}
        sx={{
          ...STYLES.debugFabStyle,
          ...(Boolean(anchorEl) ? { zIndex: 1 } : {})
        }}
        disabled={Boolean(anchorEl)}
        aria-label="debug"
        data-ref="debug.open"
      >
        <BugReportIcon />
      </Fab>
    </ThemeProvider>
  )
}
