import { useState, useEffect, useRef } from "react";
import { Typography, Box } from "@mui/material";

import { useAtom, useAtomValue } from "jotai";
import {
  pendingMembersAtom,
  pendingNotMembersAtom,
} from "../atoms/memberAtom";

import { invitationAtom } from "../atoms/invitationAtom";

import { memberStatus as statusText } from "../utils/statusText";

import LazyConnect from "./LazyConnect";
import Button from "../components/Button";
import TableList from "../components/TableList";
import SubmitBatchButton from "../components/SubmitBatchButton";

import LATEST_BLOCK_GRAPHQL from "../queries/latestBlock";
import IS_MEMBER_GRAPHQL from "../queries/isMember";
import { gql } from "@apollo/client";
import useLazyQuery from "../hooks/useLazyQuery";
import { checkMemberStatus, endorseHandle } from "../utils/checkMemberStatus";

const config = require("../utils/config.json");
const { chainId, address } = config;

function PendingEndorsements() {
  const [active, setActive] = useState("EndorseMember");
  const [storedMembers, setStoredMembers] = useAtom(pendingMembersAtom);
  const invitation = useAtomValue(invitationAtom);
  const [storedNotMembers, setStoredNotMembers] = useAtom(
    pendingNotMembersAtom,
  );
  const [tabList, setTabList] = useState([]);

  const inputRef = useRef();

  // Get latest block
  const LATEST_BLOCK_GQL = gql(LATEST_BLOCK_GRAPHQL);
  const latestBlock = useLazyQuery(LATEST_BLOCK_GQL, {
    fetchPolicy: "no-cache",
  });

  // Check if isMember
  const IS_MEMBER_GQL = gql(IS_MEMBER_GRAPHQL);
  const isMember = useLazyQuery(IS_MEMBER_GQL, {
    variables: {
      contractAddress: address,
    },
  });

  useEffect(() => {
    setTabList(active === "EndorseMember" ? storedMembers : storedNotMembers);
  }, [active, storedMembers, storedNotMembers]);

  const tableHeader = [
    {
      key: "name",
      title: "Name",
    },
    {
      key: "status",
      title: "Status",
      render: (val) => statusText[val],
    },
    {
      key: "action",
      title: "Action",
      render: (val, row) => (
        <Button
          {...{
            height: "48px",
            borderRadius: "100px",
            label: "Remove",
            active: false,
            onClick: () => removeClick(row),
          }}
        />
      ),
    },
  ];

  const removeClick = (row) => {
    if (active === "EndorseMember") {
      removeStoredMembers(row);
    } else {
      removeStoredNotMembers(row);
    }
  };

  const removeStoredMembers = (member) => {
    const newStoredMembers = storedMembers.filter(
      (item) => item.name !== member.name,
    );
    setStoredMembers(newStoredMembers);
  };
  const removeStoredNotMembers = (member) => {
    const newStoredNotMembers = storedNotMembers.filter(
      (item) => item.name !== member.name,
    );
    setStoredNotMembers(newStoredNotMembers);
  };

  const checkInfo = async () => {
    if (!inputRef.current.value) return;
    const result = await checkMemberStatus(
      inputRef.current.value,
      latestBlock,
      isMember,
    );
    if (result) {
      endorseHandle({
        member: inputRef.current.value,
        store: active === "EndorseMember" ? storedMembers : storedNotMembers,
        setStore:
          active === "EndorseMember" ? setStoredMembers : setStoredNotMembers,
        checkResult: result.isMember.value
      });
      inputRef.current.value = "";
    } else {
      console.error(result);
    }
  };

  const keyDown = (event) => {
    if (event.keyCode === 13) {
      checkInfo();
    }
  };

  return (
    <Box marginTop={8}>
      <Typography
        variant="h5"
        marginBottom={3}
        color="#101828"
        fontWeight={600}
      >
        Pending endorsements
      </Typography>
      <Box marginBottom={2.5}>
        <Button
          {...{
            label: "Endorse Member",
            active: active === "EndorseMember",
            marginRight: "8px",
            onClick: () => setActive("EndorseMember"),
          }}
        />
        <Button
          {...{
            label: "Denounce Member",
            active: active === "DenounceMember",
            onClick: () => setActive("DenounceMember"),
          }}
        />
      </Box>

      <Box
        border="1px solid #D0D5DD"
        borderRadius="10px"
        padding={4}
        overflowX="scroll"
      >
        <TableList {...{ tableHeader, tabList }} />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          borderBottom="1px solid #E5E5E5"
          paddingY="16px"
        >
          <Box
            display="flex"
            justifyContent="flex-start"
            boxSizing="border-box"
            height="50px"
            borderRadius="100px"
            padding="5px"
            marginLeft="16px"
            border="1px solid #D0D5DD"
          >
            <Typography
              component="input"
              width="100%"
              height="100%"
              display="block"
              borderRadius="100px"
              paddingLeft="10px"
              onKeyDown={keyDown}
              style={{ outline: "none", border: "0" }}
              ref={inputRef}
              placeholder="Enter new record..."
            />
            <Button
              width="81px"
              height="100%"
              margin="auto"
              color="white"
              flexShrink="0"
              borderRadius="100px"
              label="Enter"
              style={{
                background: "linear-gradient(90deg, #334FB8 0%, #1D81BE 100%)",
              }}
              onClick={checkInfo}
            />
          </Box>
        </Box>
        <br/>
        <Box textAlign="center">
          <SubmitBatchButton
            p2p
            type={active}
            subData={
              active === "EndorseMember" ? storedMembers : storedNotMembers
            }
            invitation={invitation}
            setLocalData={
              active === "EndorseMember"
                ? setStoredMembers
                : setStoredNotMembers
            }
          />
        </Box>
        <LazyConnect
          actionName="submit reports directly to the blockchain. Get a web3 compatible wallet(like metamask) to proceed"
          chainId={chainId}
          opts={{ needsAccountConnected: true }}
        >
          <SubmitBatchButton
            type={active}
            subData={
              active === "EndorseMember" ? storedMembers : storedNotMembers
            }
            invitation={invitation}
            setLocalData={
              active === "EndorseMember"
                ? setStoredMembers
                : setStoredNotMembers
            }
          />
        </LazyConnect>
      </Box>
    </Box>
  );
}

export default PendingEndorsements;
