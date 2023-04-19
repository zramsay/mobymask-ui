import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import React from "react";
import ReactDOM from "react-dom/client";
import { MultipleTabsChecker, PeerProvider } from "@cerc-io/react-peer";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { responsiveFontSizes } from "@mui/material";

import { StyledEngineProvider } from "@mui/material/styles";
import config from "./utils/config.json";
import App from "./App";
import "./index.css";

const client = new ApolloClient({
  uri: process.env.REACT_APP_WATCHER_URI,
  cache: new InMemoryCache(),
});
const theme = responsiveFontSizes(
  createTheme({
    typography: {
      fontFamily: [
        "Inter",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        '"Helvetica Neue"',
        "Arial",
        "sans-serif",
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(","),
      fontStyle: "normal",
      h1: {
        fontSize: "62px",
        lineHeight: 1.02,
        fontWeight: 600,
      },
    },
  }),
);
console.log("theme", theme);

const container = document.querySelector("#root");
const root = ReactDOM.createRoot(container);
root.render(
  <ApolloProvider client={client}>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <MultipleTabsChecker>
          <PeerProvider relayNodes={config.relayNodes ?? []} peerConfig={config.peer}>
            <App />
          </PeerProvider>
        </MultipleTabsChecker>
      </ThemeProvider>
    </StyledEngineProvider>
  </ApolloProvider>,
);
