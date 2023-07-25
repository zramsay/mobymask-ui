import { useState, useEffect, useContext } from "react";
import { PeerContext } from "@cerc-io/react-peer";
import { Typography, Box } from "@mui/material";
import { toast } from "react-hot-toast";
import { ethers } from "ethers";
import { useAtom, useAtomValue } from "jotai";

import { CopyToClipboard } from "react-copy-to-clipboard";

import LazyConnect from "./LazyConnect";
import createRegistry from "../utils/createRegistry";
import { MESSAGE_KINDS, MOBYMASK_TOPIC } from "../utils/constants";
import {
  outstandingInvitationsAtom,
  revokedInvitationsAtom,
  revokedP2PInvitationsAtom
} from "../atoms/invitationAtom";
import { invitationAtom } from "../atoms/invitationAtom";
import { providerAtom } from "../atoms/providerAtom";
import Button from "../components/Button";
import TableList from "../components/TableList";
import usePaymentGenerator from "../hooks/usePaymentGenerator";

const {
  generateUtil,
  createSignedDelegationHash,
} = require("eth-delegatable-utils");

const { chainId, address, name } = require("../utils/config.json");
const CONTRACT_NAME = name;
const util = generateUtil({
  chainId,
  verifyingContract: address,
  name: CONTRACT_NAME,
});
function MyInvitations() {
  const [active, setActive] = useState(1);
  const [outstandingInvitations, setOutstandingInvitations] = useAtom(
    outstandingInvitationsAtom,
  );

  const [revokedInvitations, setRevokedInvitations] = useAtom(
    revokedInvitationsAtom,
  );

  const [revokedP2PInvitations, setRevokedP2PInvitations] = useAtom(
    revokedP2PInvitationsAtom,
  );

  const provider = useAtomValue(providerAtom);

  const invitation = useAtomValue(invitationAtom);

  const getActionRenderHandler = (p2p = false) => (val, row, index) => {
    return (
      <>
        <CopyToClipboard
          text={row.invitationLink}
          onCopy={() => toast.success("Copy successfully!")}
        >
          <Button borderRadius="100px" height="48px" label="Copy" />
        </CopyToClipboard>
        &nbsp;
        <Button
          borderRadius="100px"
          height="48px"
          label="Revoke"
          onClick={() => revokeLink(row, index, p2p)}
        />
      </>
    );
  };

  const tableHeader = [
    {
      key: "inviteeName",
      title: "Invitee Name",
    },
    {
      key: "invitationLink",
      title: "Invite link",
      render: (val) => val && `${val.slice(0, 50)}...${val.slice(-4)}`,
    },
    {
      key: "Action",
      title: "Action",
      render: getActionRenderHandler(false)
    },
  ];

  const p2pTableHeader = [
    ...tableHeader.slice(0, 2),
    {
      key: "Action",
      title: "Action",
      render: getActionRenderHandler(true)
    }
  ]

  const [registry, setRegistry] = useState(null);
  const peer = useContext(PeerContext);

  useEffect(() => {
    if (registry || !provider) {
      return;
    }

    const ethersProvider = new ethers.providers.Web3Provider(provider, "any");

    createRegistry(ethersProvider)
      .then((_registry) => {
        setRegistry(_registry);
      })
      .catch(console.error);
  }, [registry, provider]);

  const paymentGenerator = usePaymentGenerator();

  const revokeLink = async (row, index, p2p) => {
    const loading = toast.loading("Waiting...");
    try {
      const { signedDelegations } = row.invitation;
      const signedDelegation = signedDelegations[signedDelegations.length - 1];

      const delegationHash = createSignedDelegationHash(signedDelegation);
      const intendedRevocation = {
        delegationHash,
      };
      const signedIntendedRevocation = util.signRevocation(
        intendedRevocation,
        invitation.key,
      );

      const newInvites = [...outstandingInvitations];
      const deleteInvites = newInvites.splice(index, 1);

      if (p2p && peer) {
        // Convert delegationHash from buffer to hex string before broadcasting as JSON on p2p network
        signedIntendedRevocation.intentionToRevoke.delegationHash = ethers.utils.hexlify(signedIntendedRevocation.intentionToRevoke.delegationHash)

        // Pay watcher Nitro client before broadcasting message
        const payment = await paymentGenerator()

        // Broadcast revocation on the network
        await peer.floodMessage(
          MOBYMASK_TOPIC,
          {
            payment,
            payload: {
              kind: MESSAGE_KINDS.REVOKE,
              message: { signedDelegation, signedIntendedRevocation }
            }
          }
        );

        setRevokedP2PInvitations([...revokedP2PInvitations, ...deleteInvites]);
      } else {
        const result = await registry.revokeDelegation(
          signedDelegation,
          signedIntendedRevocation,
        );
        await result.wait();
        setOutstandingInvitations(newInvites);
        setRevokedInvitations([...revokedInvitations, ...deleteInvites]);
      }

      toast.success("Revoke success!");
    } catch (err) {
      console.error(err);
      toast.error(err.reason || err.error?.message || err.message);
    }
    toast.dismiss(loading);
  };

  return (
    <Box>
      <Typography
        component="h3"
        fontSize="16px"
        marginBottom="24px"
        fontWeight={600}
      >
        My Invitations
      </Typography>
      <Box component="p" marginBottom="24px">
        <Button
          {...{
            label: "Outstanding Invitations",
            active: active === 1,
            onClick: () => setActive(1),
          }}
        />
        <Button
          {...{
            label: "Outstanding invitations (p2p network)",
            active: active === 2,
            marginX: "8px",
            onClick: () => setActive(2),
          }}
        />
        <Button
          {...{
            label: "Revoked invitations",
            active: active === 3,
            marginX: "8px",
            onClick: () => setActive(3),
          }}
        />
      </Box>
      {active === 1 ? (
        <LazyConnect
          actionName="revoke outstanding invitations."
          chainId={chainId}
          opts={{ needsAccountConnected: true }}
        >
          <TableList tableHeader={tableHeader} tabList={outstandingInvitations} />
        </LazyConnect>
      ) : active === 2 ? (
        <TableList
          tableHeader={p2pTableHeader}
          tabList={outstandingInvitations.filter((invitation) =>
            !revokedP2PInvitations.some(revokedInvitation =>
              revokedInvitation.invitation.key === invitation.invitation.key
            )
          )}
        />
      ) : active === 3 ? (
        <TableList
          tableHeader={[tableHeader[0], tableHeader[1]]}
          tabList={revokedInvitations}
        />
      ) : (
        <Typography>Invalid option</Typography>
      )}
    </Box>
  );
}

export default MyInvitations;
