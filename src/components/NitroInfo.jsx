import React, { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { JSONbigNative } from '@cerc-io/nitro-util';

const STYLES = {
  json: {
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
  }
}

export function NitroInfo ({ nitro }) {
  const [knownClients, setKnownClients] = useState([]);
  const [channels, setChannels] = useState([]);
  const [msgServiceId, setMsgServiceId] = useState('');

  const updateInfo = useCallback(async () => {
    const channels = await nitro.getAllLedgerChannels();

    const paymentChannelPromises = channels.map(async (channel) => {
      const channelJSON = channel.toJSON()
      const paymentChannels = await nitro.getPaymentChannelsByLedger(channelJSON.ID.value)

      return {
        ...channelJSON,
        paymentChannels: paymentChannels.map(paymentChannel => paymentChannel.toJSON())
      }
    });

    setKnownClients([]);

    // TODO: Add method for getting private peers
    nitro.msgService.peers.range((_, peerInfo) => {
      setKnownClients((prevClients) => [...prevClients, peerInfo]);
      return true;
    });

    setMsgServiceId(await nitro.msgService.id())
    const channelsJSON = await Promise.all(paymentChannelPromises);
    setChannels(channelsJSON);
  }, [nitro]);

  useEffect(() => {
    if (nitro) {
      updateInfo()
    }
  }, [nitro, updateInfo])

  return (
    <ScopedCssBaseline>
      <Button
        variant="contained"
        size="small"
        onClick={updateInfo}
      >
        UPDATE
      </Button>
      {nitro && (
        <Box
          sx={STYLES.json}
        >
          <Box sx={STYLES.textBox}>
            <Typography variant="body2" >
              Client address: {nitro.client.address}
            </Typography>
            <Typography variant="body2" >
              Message service ID: {msgServiceId.toString()}
            </Typography>
          </Box>
          <Typography variant="body2" >
            Known clients
          </Typography>
          <Box sx={STYLES.textBox}>
            {
              knownClients.map(knownClient => (
                <Typography key={knownClient.id} component='div' variant="body2" >
                  <pre>{JSONbigNative.stringify(knownClient, null, 2)}</pre>
                </Typography>
              ))
            }
          </Box>
          <Typography variant="body2" >
            Ledger channels
          </Typography>
          <Box sx={STYLES.textBox}>
            {
              channels.map(channel => (
                <Typography key={channel.ID} component='div' variant="body2" >
                  <pre>{JSONbigNative.stringify(channel, null, 2)}</pre>
                </Typography>
              ))
            }
          </Box>
        </Box>
      )}
    </ScopedCssBaseline>
  )
}
