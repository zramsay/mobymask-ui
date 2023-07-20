import React from "react";
import { useApolloClient } from "@apollo/client";

/**
 * Small wrapper to make useLazyQuery return a promise
 *
 * @see Expanded on from: https://github.com/apollographql/react-apollo/issues/3499#issuecomment-539346982
 *
 */
export default function useLazyQuery(query, options) {
  const client = useApolloClient();
  return React.useCallback(
    // TODO: Debug headers not passed in network request
    (variables, headers) => client.query({
      ...options,
      query: query,
      variables: {
        ...options?.variables,
        ...variables,
      },
      context: {
        ...options?.context,
        ...headers
      }
    }),
    [client, query, options],
  );
}
