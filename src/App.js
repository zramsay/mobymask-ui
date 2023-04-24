import React, { useCallback, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { PeerContext } from "@cerc-io/react-peer";
import { getPseudonymForPeerId } from "@cerc-io/peer";
import "./utils/installBuffer";
import QueryParamsRoute from "./views/RoutableArea";
import { HashRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import CheckPhisherStatus from "./views/CheckPhisherStatus";
import CheckMemberStatus from "./views/CheckMemberStatus";
import HeaderBox from "./views/HeaderBox";
import InstallExtension from "./views/InstallExtension";
import FooterBox from "./views/FooterBox";
import { MESSAGE_KINDS, MOBYMASK_TOPIC, DISPLAY_ENDORSE_MEMBERS } from "./utils/constants";
import { getCurrentTime } from "./utils/getCurrentTime";
import artifacts from "./utils/artifacts.json";
import DebugPanel from "./components/DebugPanel";

const contractInterface = new ethers.utils.Interface(artifacts.abi);

function App() {
  const peer = useContext(PeerContext);
  const [messages, setMessages] = useState([]);

  const handleTopicMessage = useCallback((peerId, data) => {
    const { kind, message } = data;
    const messageLogs = [`[${getCurrentTime()}] Received a message on mobymask P2P network from peer: ${peerId.toString()} (${getPseudonymForPeerId(peerId.toString())})`];

    switch (kind) {
      case MESSAGE_KINDS.INVOKE: {
        messageLogs.push(
          "Signed invocations:",
          JSON.stringify(message, null, 2)
        );

        const [{ invocations: { batch: invocationsList } }] = message;
        Array.from(invocationsList).forEach(invocation => {
          const txData = invocation.transaction.data;
          const decoded = contractInterface.parseTransaction({ data: txData });

          messageLogs.push(`method: ${decoded.name}, value: ${decoded.args[0]}`);
        });

        break;
      }

      case MESSAGE_KINDS.REVOKE: {
        const { signedDelegation, signedIntendedRevocation } = message;

        messageLogs.push(
          "Signed delegation:",
          JSON.stringify(signedDelegation, null, 2),
          "Signed intention to revoke:",
          JSON.stringify(signedIntendedRevocation, null, 2),
        );

        break;
      }

      default:
        break;
    }

    messageLogs.forEach(messageLog => console.log(messageLog))
    setMessages(prevMessages => ([...prevMessages, messageLogs]))
    console.log('------------------------------------------')
  }, [])

  useEffect(() => {
    if (peer) {
      const unsubscribe = peer.subscribeTopic(MOBYMASK_TOPIC, handleTopicMessage);

      return unsubscribe;
    }
  }, [peer, handleTopicMessage]);

  useEffect(() => {
    if (!peer || !peer.node) {
      return
    }

    // For debugging
    window.peer = peer;
  }, [peer])

  return (
    <div className="App">
      <Toaster />
      <HeaderBox />
      <CheckPhisherStatus />
      {DISPLAY_ENDORSE_MEMBERS && <CheckMemberStatus />}
      <HashRouter>
        <QueryParamsRoute />
      </HashRouter>

      <InstallExtension />
      <FooterBox />
      <DebugPanel messages={messages} />
    </div>
  );
}

export default App;
