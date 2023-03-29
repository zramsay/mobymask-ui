import React from "react";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { PeerProvider, MultipleTabsChecker } from "@cerc-io/react-peer";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import config from "./config.json";

const client = new ApolloClient({
  uri: process.env.REACT_APP_WATCHER_URI,
  cache: new InMemoryCache(),
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <MultipleTabsChecker>
      <PeerProvider relayNodes={config.relayNodes ?? []} peerConfig={config.peer}>
        <App />
      </PeerProvider>
    </MultipleTabsChecker>
  </ApolloProvider>,
  document.getElementById("root"),
);
