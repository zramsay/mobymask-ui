import { ethers } from "ethers";
import React, { useContext, useEffect, useState } from "react";
import { PeerContext } from "@cerc-io/react-peer";
import createRegistry from "./createRegistry";
import linkForInvitation from "./linkForInvitation";
import copyInvitationLink from "./copyInvitationLink";
import { MESSAGE_TYPES, MOBYMASK_TOPIC } from "./constants";

const { generateUtil, createSignedDelegationHash } = require("eth-delegatable-utils");
const { chainId, address, name } = require("./config.json");
const CONTRACT_NAME = name;
const util = generateUtil({
  chainId,
  verifyingContract: address,
  name: CONTRACT_NAME,
});


export default function (props) {
  const { provider, invitations, invitation, setInvitations, setRevokedP2PInvitations, revokedP2PInvitations = [], p2p = false } = props;
  const [registry, setRegistry] = useState(null);
  const peer = useContext(PeerContext);
  
  // Get registry
  useEffect(() => {
    if (registry || !provider) {
      return;
    }
    
    const ethersProvider = new ethers.providers.Web3Provider(provider, "any");
  
    createRegistry(ethersProvider)
      .then(_registry => {
        setRegistry(_registry);
      })
      .catch(console.error);
  });

  if (!p2p && !registry) {
    return <p>Loading...</p>;
  }

  return (
    <details className="box">
      <summary>Outstanding Invitations ({invitations.length - revokedP2PInvitations.length}) {p2p && "in p2p network"}</summary>
      {invitations
        .filter((_invitation) => !revokedP2PInvitations.some(revokedInvitation => revokedInvitation.invitation.key === _invitation.invitation.key))
        .map((_invitation, index) => {
        return (
          <div key={index}>
            <span>{_invitation.petName}</span>
            <input type="text" readOnly value={linkForInvitation(_invitation.invitation)}></input>
            <button
              onClick={() => {
                copyInvitationLink(_invitation.invitation, _invitation.petName).catch(err => alert(err.message));
              }}
            >
              Copy
            </button>
            <button
              onClick={async () => {
                const { signedDelegations } = _invitation.invitation;
                const signedDelegation = signedDelegations[signedDelegations.length - 1];

                const delegationHash = createSignedDelegationHash(signedDelegation);
                const intendedRevocation = {
                  delegationHash,
                };
                const signedIntendedRevocation = util.signRevocation(intendedRevocation, invitation.key);
                
                if (p2p && peer) {
                  // Broadcast revocation on the network
                  peer.floodMessage(
                    MOBYMASK_TOPIC,
                    {
                      type: MESSAGE_TYPES.REVOKE,
                      message: { signedDelegation, signedIntendedRevocation }
                    }
                  );

                  setRevokedP2PInvitations((oldRevokedInvitations) => {
                    const newRevokedInvitations = [...oldRevokedInvitations, _invitation];
                    localStorage.setItem("revokedP2PInvitations", JSON.stringify(newRevokedInvitations));
                    return newRevokedInvitations;
                  });
                } else {
                  const newInvites = [...invitations];
                  newInvites.splice(index, 1);
                  await registry.revokeDelegation(signedDelegation, signedIntendedRevocation);
                  localStorage.setItem("outstandingInvitations", JSON.stringify(newInvites));
                  setInvitations(newInvites);
                }
              }}
            >
              Revoke { p2p ? "(p2p network)" : "(blockchain)"}
            </button>
          </div>
        );
      })}
    </details>
  );
}
