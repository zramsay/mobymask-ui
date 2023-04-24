import { useContext } from "react";
import { PeerContext } from "@cerc-io/react-peer";
import Button from "./Button";
import reportMembers from "../utils/reportMembers";
import reportPhishers from "../utils/reportPhishers";
import { reportTypes } from "../utils/constants";
import { toast } from "react-hot-toast";
const { ethers } = require("ethers");
function SubmitBatchButton(props) {
  const { type, provider, subData, invitation = false, setLocalData, p2p = false } = props;
  const peer = useContext(PeerContext);

  const reportOptions = {
    invitation
  };

  if (p2p) {
    reportOptions.peer = peer;
  } else {
    const ethersProvider = new ethers.providers.Web3Provider(provider, "any");
    reportOptions.provider = ethersProvider;
  }

  const submitClick = () => {
    switch (type) {
      case "ReportPhisher":
        phishingReport(true);
        break;

      case "ReportNotPhisher":
        phishingReport(false);
        break;

      case "EndorseMember":
        memberReport(true);
        break;

      case "DenounceMember":
        memberReport(false);
        break;

      default:
        break;
    }
  };

  const memberReport = async (isReportMember) => {
    const loading = toast.loading("Waiting...");
    if (!invitation) return;

    reportOptions.members = subData.map((item) => {
      const name = item.name.indexOf("@") === 0 ? item.name.slice(1) : item.name;

      return `TWT:${name.toLowerCase()}`;
    });

    reportOptions.isMember = isReportMember;

    try {
      await reportMembers(reportOptions);
      document.dispatchEvent(new Event("clear_pendingMembers"));
      setLocalData([]);
      toast.success(`Batch submitted to ${p2p ? 'p2p network' : 'blockchain'}!`);
    } catch (err) {
      toast.error(err.reason || err.error.message);
    }
    toast.dismiss(loading);
  };

  const phishingReport = async (isReportPhisher) => {
    const loading = toast.loading("Waiting...");
    reportOptions.phishers = subData.map((item) => {
      const name =
        item.name.indexOf("@") === 0 ? item.name.slice(1) : item.name;
      const type = reportTypes.find(
        (report) => report.label === item.type,
      )?.value;
      return `${type}:${name.toLowerCase()}`;
    });
    reportOptions.isPhisher = isReportPhisher;

    try {
      await reportPhishers(reportOptions);
      document.dispatchEvent(new Event("clear_pendingPhishers"));
      setLocalData([]);
      toast.success(`Batch submitted to ${p2p ? 'p2p network' : 'blockchain'}!`);
    } catch (err) {
      toast.error(err.reason || err.error.message);
    }
    toast.dismiss(loading);
  };

  return (
    <>
      {subData.length !== 0 && (
        <Button
          color="#fff"
          borderRadius="100px"
          style={{
            background: "linear-gradient(90deg, #334FB8 0%, #1D81BE 100%)",
          }}
          label={p2p ? "Submit batch to p2p network" : "Submit batch to blockchain"}
          marginTop="30px"
          onClick={submitClick}
        />
      )}
    </>
  );
}

export default SubmitBatchButton;
