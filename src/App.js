import React, { useCallback, useState } from "react";
import { HashRouter } from "react-router-dom";
import { ethers } from 'ethers';
import { PeerContext } from "@cerc-io/react-peer";
import { getPseudonymForPeerId } from "@cerc-io/peer";
import logo from "./logo.svg";
import "./installBuffer";
import QueryParamsRoute from "./RoutableArea";
import "./App.css";
import { MESSAGE_KINDS, MOBYMASK_TOPIC } from "./constants";
import DebugPanel from "./DebugPanel";
const { abi:PhisherRegistryABI } = require("./artifacts");

const contractInterface = new ethers.utils.Interface(PhisherRegistryABI);

function App() {
  const peer = React.useContext(PeerContext);
  const [messages, setMessages] = useState([])

  const handleTopicMessage = useCallback((peerId, data) => {
    const { kind, message } = data;
    const messageLogs = [`Received a message on mobymask P2P network from peer: ${peerId.toString()} (${getPseudonymForPeerId(peerId.toString())})`];

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
  }, []);

  React.useEffect(() => {
    if (peer) {
      const unsubscribe = peer.subscribeTopic(MOBYMASK_TOPIC, handleTopicMessage);

      return unsubscribe;
    }
  }, [peer, handleTopicMessage]);

  React.useEffect(() => {
    if (!peer || !peer.node) {
      return
    }

    // For debugging
    window.peer = peer;
  }, [peer])

  return (
    <div className="App">
      <header className="App-header">

        <div className="logo-bar">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>
            MobyMask
          </h1>
        </div>

        {/* Based on https://codepen.io/goodkatz/pen/LYPGxQz?editors=1100 */}
        <div class="waves">
          <svg class="waves" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
          <defs>
          <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
          </defs>
          <g class="parallax">
          <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(255,255,255,0.7" />
          <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.5)" />
          <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(255,255,255,0.3)" />
          <use xlinkHref="#gentle-wave" x="48" y="7" fill="#fff" />
          </g>
          </svg>
          <p>An alliance of good-hearted phish, aiming to eliminate phishers.</p>
        </div>

      </header>

      <HashRouter>
        <QueryParamsRoute />
      </HashRouter>

      <div className="footer">
        <p>Reporters are added on an invite-only basis.</p>
        <p>
          <a href="https://mirror.xyz/0x55e2780588aa5000F464f700D2676fD0a22Ee160/8whNch3m5KMzeo6g5eblcXMMplPf8UpW228cSh3nmzg">
            Learn more
          </a>
        </p>
        <p>
          <a href="https://github.com/danfinlay/MobyMask/">Fork on GitHub</a>
        </p>
      </div>
      <DebugPanel messages={messages} />
    </div>
  );
}

export default App;
