import React from "react";
import { useAtom } from "jotai";

import { signEthereumMessage, utils } from "@cerc-io/nitro-client-browser";
import { hex2Bytes } from "@cerc-io/nitro-util"

import { nitroKeyAtom } from "../atoms/nitroKeyAtom";

const EMPTY_VOUCHER_HASH = '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'; // keccak256('0x')

export default function useSignedEmptyVoucher() {
  const [nitroKey] = useAtom(nitroKeyAtom);

  return React.useMemo(() => {
    if (!nitroKey) {
      return {
        vhash: EMPTY_VOUCHER_HASH
      }
    }

    const signature = signEthereumMessage(Buffer.from(EMPTY_VOUCHER_HASH), hex2Bytes(nitroKey));

    return {
      vhash: EMPTY_VOUCHER_HASH,
      vsig: utils.getJoinedSignature(signature)
    }
  }, [nitroKey]);
}
