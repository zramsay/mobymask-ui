import React from "react";
import { useAtom } from "jotai";

import { utils } from "@cerc-io/nitro-client-browser";

import { nitroAtom } from "../atoms/nitroAtom";
import { watcherPaymentChannelIdAtom } from "../atoms/watcherPaymentChannelIdAtom";
import { payAmountAtom } from "../atoms/payAmountAtom";

export default function usePaymentGenerator() {
  const [nitro] = useAtom(nitroAtom);
  const [watcherPaymentChannelId] = useAtom(watcherPaymentChannelIdAtom);
  const [payAmount] = useAtom(payAmountAtom);

  return React.useCallback(async () => {
    if (!nitro) {
      throw new Error('Setup Nitro client before making payment');
    }

    if (!watcherPaymentChannelId) {
      throw new Error('Create payment channel with watcher before making payment');
    }

    const voucher = await nitro.pay(watcherPaymentChannelId, payAmount);

    return {
      vhash: voucher.hash(),
      vsig: utils.getJoinedSignature(voucher.signature)
    }
  }, [nitro, watcherPaymentChannelId, payAmount]);
}
