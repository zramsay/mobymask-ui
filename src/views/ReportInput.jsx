import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { Buffer } from 'buffer';
import { Typography, Box } from "@mui/material";
import { reportTypes as options } from "../utils/constants";
import { toast } from "react-hot-toast";
import { gql } from "@apollo/client";
import { signEthereumMessage, utils } from "@cerc-io/nitro-client-browser"
import { hex2Bytes } from "@cerc-io/nitro-util";
import useLazyQuery from "../hooks/useLazyQuery";
import LATEST_BLOCK_GRAPHQL from "../queries/latestBlock";
import IS_PHISHER_GRAPHQL from "../queries/isPhisher";
import IS_MEMBER_GRAPHQL from "../queries/isMember";
// import createPhisherLabel from "../createPhisherLabel";
import { checkPhisherStatus } from "../utils/checkPhisherStatus";
import { checkMemberStatus } from "../utils/checkMemberStatus";
import ReportInputInfo from "../views/ReportInputInfo";
import config from "../utils/config.json";
import search_icon from "../assets/search.png";
import { nitroKeyAtom } from "../atoms/nitroKeyAtom";
import { nitroAtom } from "../atoms/nitroAtom";
import { watcherPaymentChannelIdAtom } from "../atoms/watcherPaymentChannelIdAtom";
import { payAmountAtom } from "../atoms/payAmountAtom";
const { address } = config;

const EMPTY_VOUCHER_HASH = '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'; // keccak256('0x')

window.PAY_FOR_GQL_REQUESTS = true;

function ReportInput({ isMemberCheck = false }) {
  const [selectedOption, setSelectedOption] = useState("TWT");
  const [checkResult, setCheckResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isShow, setIsShow] = useState(false);
  const inputRef = useRef();
  const [nitroKey] = useAtom(nitroKeyAtom);
  const [nitro] = useAtom(nitroAtom);
  const [watcherPaymentChannelId] = useAtom(watcherPaymentChannelIdAtom);
  const [payAmount] = useAtom(payAmountAtom);

  useEffect(() => {
    inputRef.current.value = "";
  }, [selectedOption]);

  // Get latest block
  const LATEST_BLOCK_GQL = gql(LATEST_BLOCK_GRAPHQL);
  const latestBlock = useLazyQuery(LATEST_BLOCK_GQL, {
    fetchPolicy: "no-cache",
  });

  // Check if isPhisher
  const IS_PHISHER_GQL = gql(IS_PHISHER_GRAPHQL);
  const isPhisher = useLazyQuery(IS_PHISHER_GQL, {
    fetchPolicy: "no-cache",
    variables: {
      contractAddress: address,
    }
  });

  // Check if isPhisher
  const IS_MEMBER_GQL = gql(IS_MEMBER_GRAPHQL);
  const isMember = useLazyQuery(IS_MEMBER_GQL, {
    fetchPolicy: "no-cache",
    variables: {
      contractAddress: address,
    }
  });

  const emptyVoucherHashSignature = useMemo(() => {
    return signEthereumMessage(Buffer.from(EMPTY_VOUCHER_HASH), hex2Bytes(nitroKey));
  }, [nitroKey])

  async function submitFrom() {
    if (!inputRef.current.value) return;
    setIsLoading(true);

    try {
      let hash = EMPTY_VOUCHER_HASH;
      let signature = emptyVoucherHashSignature;

      if (window.PAY_FOR_GQL_REQUESTS && nitro && watcherPaymentChannelId) {
        const voucher = await nitro.pay(watcherPaymentChannelId, payAmount);
        hash = voucher.hash();
        signature = voucher.signature;
      }

      const requestHeaders = {
        Hash: hash,
        Sig: utils.getJoinedSignature(signature)
      }

      if (isMemberCheck) {
        const result = await checkMemberStatus(
          inputRef.current.value,
          latestBlock,
          isMember,
          requestHeaders
        );
        if (result) {
          setCheckResult(result?.isMember?.value);
        } else {
          console.error(result);
        }
      } else {
        const result = await checkPhisherStatus(
          selectedOption,
          inputRef.current.value,
          latestBlock,
          isPhisher,
          requestHeaders
        );
        if (result) {
          setCheckResult(result?.isPhisher?.value);
        } else {
          console.error(result);
        }
      }

      setIsShow(true);
    } catch (err) {
      if (err.message === 'Response not successful: Received status code 402') {
        // TODO: Fix error handling to show message from server
        toast.error(`Error: Payment voucher not received`);
      } else {
        toast.error(`Error: ${err.message}`);
      }

      setIsShow(false);
    }

    setIsLoading(false);
  }

  const changeOptions = (item) => {
    clearInput();
    setSelectedOption(item.value);
  };

  const clearInput = () => {
    setIsShow(false);
    inputRef.current.value = "";
  };

  const keyDown = (event) => {
    if (event.keyCode === 13) {
      submitFrom();
    }
  };

  return (
    <>
      {!isMemberCheck && (
        <Box display="flex" justifyContent="center">
          {options.map((item) => (
            <Box
              margin="0 4px"
              padding="8px 18px 6px 18px"
              border="1px solid #D0D5DD"
              borderColor={selectedOption === item.value ? "#101828" : "#D0D5DD"}
              color={selectedOption === item.value ? "#fff" : "#D0D5DD"}
              backgroundColor={selectedOption === item.value ? "#101828" : "#fff"}
              borderRadius="10px 10px 0px 0px"
              borderBottom="none"
              style={{ cursor: "pointer", fontFamily: "Inter" }}
              key={item.value}
              onClick={() => changeOptions(item)}
            >
              {item?.label}
            </Box>
          ))}
        </Box>
      )}
      <Box
        position="relative"
        width="100%"
        height={80}
        minHeight="50px"
        margin="auto"
        boxShadow="0px 0px 30px rgba(0, 0, 0, 0.05)"
        borderRadius="100px"
      >
        <Typography
          width="100%"
          height="100%"
          fontSize="18px"
          padding="0 35px"
          boxSizing="border-box"
          component="input"
          borderRadius="100px"
          border="1px solid #D0D5DD"
          sx={{
            backgroundColor: "#fff",
            ":focus": {
              outline: "#2867BB",
              borderColor: "#2867BB",
            },
          }}
          ref={inputRef}
          onKeyDown={keyDown}
          placeholder={`Enter a ${
            options.find((item) => item.value === selectedOption).label
          } to check if it is a ${isMemberCheck ? 'member' : 'phisher'}...`}
        />
        <Box
          width="80px"
          height="80px"
          onClick={submitFrom}
          sx={{ cursor: "pointer" }}
          position="absolute"
          top="0"
          right="0"
          bottom="0"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Typography
            component="img"
            width="24px"
            height="24px"
            src={search_icon}
          />
        </Box>
      </Box>
      {isShow && (
        <ReportInputInfo
          {...{
            checkResult,
            selectedOption,
            value: inputRef.current.value,
            clearInput,
            isLoading,
            isMemberCheck
          }}
        />
      )}
    </>
  );
}

export default React.memo(ReportInput);
