import React from "react";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { PeerProvider } from "@cerc-io/react-peer";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";

const client = new ApolloClient({
  uri: process.env.REACT_APP_WATCHER_URI,
  cache: new InMemoryCache(),
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <PeerProvider relayNode={process.env.REACT_APP_RELAY_NODE}>
      <App />
    </PeerProvider>
  </ApolloProvider>,
  document.getElementById("root"),
);
