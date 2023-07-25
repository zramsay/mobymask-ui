import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { useAtom } from 'jotai';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline';
import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableRow, TextField } from '@mui/material';
import { utils } from "@cerc-io/nitro-client-browser";
import { JSONbigNative } from '@cerc-io/nitro-util';

import contractAddresses from "../utils/nitro-addresses.json";
import { nitroKeyAtom } from '../atoms/nitroKeyAtom';
import { nitroAtom } from '../atoms/nitroAtom';
import { payAmountAtom } from '../atoms/payAmountAtom';
import { watcherPaymentChannelIdAtom } from '../atoms/watcherPaymentChannelIdAtom';

const STYLES = {
  selfInfoHead: {
    marginTop: 1/2,
    marginBottom: 1/2
  },
  selfInfo: {
    marginBottom: 1
  },
  knownClients: {
    marginTop: 1
  },
  commandButton: {
    marginTop: 1,
    marginBottom: 1.5
  },
  textBox: {
    '& pre': {
      font: 'inherit',
      marginY: 0,
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word'
    }
  }
}

window.clearClientStorage = utils.Nitro.clearClientStorage;

window.out = (jsonObject) => {
  console.log(JSONbigNative.stringify(jsonObject, null, 2));
};

export function NitroInfo ({ provider, peer }) {
  const [nitro, setNitro] = useAtom(nitroAtom);
  const [nitroKey] = useAtom(nitroKeyAtom);
  const [knownClients, setKnownClients] = useState([]);
  const [ledgerChannels, setLedgerChannels] = useState(new Map());
  const [paymentChannels, setPaymentChannels] = useState(new Map());
  const [msgServiceId, setMsgServiceId] = useState('');
  const [directFundAmount, setDirectFundAmount] = useState(1_000_000_000);
  const [virtualFundAmount, setVirtualFundAmount] = useState(1_000);
  const [payAmount, setPayAmount] = useAtom(payAmountAtom);
  const [, setWatcherPaymentChannelId] = useAtom(watcherPaymentChannelIdAtom)

  const clientLedgerChannelMap = useMemo(() => {
    return Array.from(ledgerChannels.values()).reduce((acc, channel) => {
      acc.set(channel.balance.hub, channel.iD);
      return acc;
    }, new Map())
  }, [ledgerChannels]);

  const clientPaymentChannelsMap = useMemo(() => {
    return Array.from(paymentChannels.values()).reduce((acc, channel) => {
      const clientChannels = acc.get(channel.balance.payer) ?? [];
      clientChannels.push(channel.iD);
      acc.set(channel.balance.payee, clientChannels);
      return acc;
    }, new Map());
  }, [paymentChannels]);

  // Set watcher client payment channel
  useEffect(() => {
    const watcherClient = knownClients.find(knownClient => knownClient.address === process.env.REACT_APP_PAY_TO_NITRO_ADDRESS);

    if (!watcherClient) {
      return;
    }

    const paymentChannels = clientPaymentChannelsMap.get(watcherClient.address)

    if (!paymentChannels || !paymentChannels.length) {
      return;
    }

    setWatcherPaymentChannelId(paymentChannels[0].value)
  }, [knownClients, clientPaymentChannelsMap, setWatcherPaymentChannelId])

  useEffect(() => {
    if (!nitroKey || !provider || !peer || nitro) {
      return;
    }

    const setupClient = async () => {
      const loading = toast.loading("Starting Nitro client...");
      const ethersProvider = new ethers.providers.Web3Provider(provider, "any");

      const nitro = await utils.Nitro.setupClientWithProvider(
        nitroKey,
        ethersProvider,
        contractAddresses,
        peer,
        `${nitroKey}-db`
      );

      setNitro(nitro);
      toast.dismiss(loading);

      // For debugging
      window.nitro = nitro;
    }

    setupClient();
  }, [provider, nitroKey, peer, nitro, setNitro]);

  const refreshInfo = useCallback(async () => {
    const channels = await nitro.getAllLedgerChannels();
    const paymentChannelsMap = new Map();

    const paymentChannelPromises = channels.map(async (channel) => {
      const paymentChannels = await nitro.getPaymentChannelsByLedger(channel.iD.value);

      paymentChannels.forEach(paymentChannel => {
        paymentChannelsMap.set(paymentChannel.iD, paymentChannel);
      });
    });

    setMsgServiceId(await nitro.msgService.id());
    await Promise.all(paymentChannelPromises);
    setPaymentChannels(paymentChannelsMap);

    // Convert array to map for easy rendering
    const ledgerChannelsMap = channels.reduce((acc, channel) => {
      acc.set(channel.iD, channel);
      return acc;
    }, new Map());

    setLedgerChannels(ledgerChannelsMap);
    setKnownClients([]);

    // TODO: Add method for getting private peers
    nitro.msgService.peers.range((_, peerInfo) => {
      setKnownClients((prevClients) => [...prevClients, peerInfo]);
      return true;
    });
  }, [nitro]);

  const handleDirectFund = useCallback(async (counterpartyAddress) => {
    await nitro.directFund(counterpartyAddress, directFundAmount);

    // TODO: Add only required ledgerChannel using nitro.getLedgerChannel
    await refreshInfo();
  }, [nitro, refreshInfo, directFundAmount]);

  const handleDirectDefund = useCallback(async (ledgerChannelId) => {
    await nitro.directDefund(ledgerChannelId.value)

    // TODO: Update only required ledgerChannel using nitro.getLedgerChannel
    await refreshInfo();
  }, [nitro, refreshInfo]);

  const handleVirtualFund = useCallback(async (counterpartyAddress) => {
    await nitro.virtualFund(counterpartyAddress, virtualFundAmount);

    // TODO: Add only required paymentChannel using nitro.getPaymentChannel
    await refreshInfo();
  }, [nitro, refreshInfo, virtualFundAmount]);

  const handlePay = useCallback(async (paymentChannelId) => {
    await nitro.pay(paymentChannelId.value, payAmount);

    // TODO: Update only required paymentChannel using nitro.getPaymentChannel
    await refreshInfo();
  }, [nitro, refreshInfo, payAmount]);

  const handleVirtualDefund = useCallback(async (paymentChannelId) => {
    await nitro.virtualDefund(paymentChannelId.value)

    // TODO: Update only required paymentChannel using nitro.getPaymentChannel
    await refreshInfo();
  }, [nitro, refreshInfo]);

  useEffect(() => {
    if (nitro) {
      refreshInfo()
    }
  }, [nitro, refreshInfo])

  if (!nitro) {
    return;
  }

  return (
    <ScopedCssBaseline>
      <Box textAlign="left">
        <Grid container sx={STYLES.selfInfoHead}>
          <Grid item xs="auto">
            <Typography variant="subtitle2" color="inherit" noWrap>
              <b>Self Info</b>
            </Typography>
          </Grid>
          <Grid item xs />
          <Button
            variant="contained"
            size="small"
            onClick={refreshInfo}
          >
            REFRESH
          </Button>
        </Grid>

        <TableContainer sx={STYLES.selfInfo} component={Paper}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell size="small"><b>Client Address</b></TableCell>
                <TableCell size="small">{nitro.client.address}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell size="small"><b>Message Service ID</b></TableCell>
                <TableCell size="small">{msgServiceId.toString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="subtitle2" color="inherit" noWrap>
          <b>Known Clients</b>
        </Typography>

        { knownClients.map(knownClient => (
          <TableContainer sx={STYLES.knownClients} key={knownClient.id} component={Paper}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell size="small"><b>Address</b></TableCell>
                  <TableCell size="small">{knownClient.address}</TableCell>
                  <TableCell size="small" align="right"><b>Peer ID</b></TableCell>
                  <TableCell size="small">{knownClient.id.toString()}</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell size="small" colSpan={2}>
                    <Box display="flex" sx={STYLES.commandButton}>
                      {Boolean(clientLedgerChannelMap.has(knownClient.address)) ? (
                        <Button
                          disabled={ledgerChannels.get(clientLedgerChannelMap.get(knownClient.address)).status === 'Complete'}
                          variant="contained"
                          onClick={() => handleDirectDefund(clientLedgerChannelMap.get(knownClient.address))}
                        >
                          DIRECT DEFUND
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="contained"
                            onClick={() => handleDirectFund(knownClient.address)}
                          >
                            DIRECT FUND
                          </Button>
                          &nbsp;
                          <TextField
                            size="small"
                            label="Amount"
                            value={directFundAmount}
                            type="number"
                            onChange={event => setDirectFundAmount(event.target.value)}
                          />
                        </>
                      )}
                    </Box>
                    <Box display="flex">
                      {Boolean(ledgerChannels.size) && (
                        // TODO: Try creating payment channels using intermediaries
                        <>
                          <Button
                            variant="contained"
                            onClick={() => handleVirtualFund(knownClient.address)}
                          >
                            VIRTUAL FUND
                          </Button>
                          &nbsp;
                          <TextField
                            label="Amount"
                            value={virtualFundAmount}
                            type="number"
                            size="small"
                            onChange={event => setVirtualFundAmount(event.target.value)}
                          />
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell size="small" colSpan={2}>
                    <Typography variant="subtitle2" color="inherit" noWrap>
                      <b>{ clientLedgerChannelMap.has(knownClient.address) && "Ledger Channel" }</b>
                    </Typography>
                    <Box sx={STYLES.textBox}>
                      {
                        <Typography component='div' variant="body2" >
                          <pre>
                            {JSONbigNative.stringify(
                              ledgerChannels.get(clientLedgerChannelMap.get(knownClient.address)),
                              null,
                              2
                            )}
                          </pre>
                        </Typography>
                      }
                    </Box>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell size="small" colSpan={4}>
                    <b>Payment Channels</b>
                  </TableCell>
                </TableRow>
                {clientPaymentChannelsMap.get(knownClient.address)?.map(paymentChannel => (
                  <TableRow key={paymentChannel.value}>
                    <TableCell size="small" colSpan={2}>
                      <Box display="flex" sx={STYLES.commandButton}>
                        <Button
                          variant="contained"
                          onClick={() => handlePay(paymentChannel)}
                        >
                          PAY
                        </Button>
                        &nbsp;
                        <TextField
                          size="small"
                          label="Amount"
                          value={payAmount}
                          type="number"
                          onChange={event => setPayAmount(event.target.value)}
                        />
                      </Box>
                      <Box>
                        <Button
                          variant="contained"
                          onClick={() => handleVirtualDefund(paymentChannel)}
                        >
                          VIRTUAL DEFUND
                        </Button>
                      </Box>
                    </TableCell>
                    <TableCell size="small" colSpan={2}>
                      <Box sx={STYLES.textBox}>
                        {
                          <Typography component='div' variant="body2" >
                            <pre>
                              {JSONbigNative.stringify(
                                paymentChannels.get(paymentChannel),
                                null,
                                2
                              )}
                            </pre>
                          </Typography>
                        }
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ))}
      </Box>
    </ScopedCssBaseline>
  )
}
