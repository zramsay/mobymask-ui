import { useAtom, useAtomValue } from "jotai";
import { Typography, Box } from "@mui/material";

import Button from "../components/Button";
import {
  pendingPhishersAtom,
  pendingNotPhishersAtom,
} from "../atoms/phisherAtom";
import {
  pendingMembersAtom,
  pendingNotMembersAtom,
} from "../atoms/memberAtom";
import { invitationAtom } from "../atoms/invitationAtom";
import { reportTypes } from "../utils/constants";
import { reportHandle } from "../utils/checkPhisherStatus";
import { endorseHandle } from "../utils/checkMemberStatus";
import error_icon from "../assets/error_icon.png";
import success_icon from "../assets/success_icon.png";

function ReportInputInfo(props) {
  const {
    isLoading,
    checkResult,
    selectedOption,
    value = "",
    clearInput = () => {},
    isMemberCheck = false
  } = props;
  const [storedPhishers, setStoredPhishers] = useAtom(pendingPhishersAtom);
  const [storedNotPhishers, setStoredNotPhishers] = useAtom(
    pendingNotPhishersAtom,
  );
  const [storedMembers, setStoredMembers] = useAtom(pendingMembersAtom);
  const [storedNotMembers, setStoredNotMembers] = useAtom(
    pendingNotMembersAtom,
  );
  const invitation = useAtomValue(invitationAtom);

  const handleReport = () => {
    if (isMemberCheck) {
      endorseHandle({
        member: value,
        checkResult,
        store: checkResult ? storedNotMembers : storedMembers,
        setStore: checkResult ? setStoredNotMembers : setStoredMembers,
        clearMember: clearInput,
      });
    } else {
      reportHandle({
        phisher: value,
        checkResult,
        store: checkResult ? storedNotPhishers : storedPhishers,
        setStore: checkResult ? setStoredNotPhishers : setStoredPhishers,
        clearPhisher: clearInput,
        reportTypes,
        selectedOption,
      });
    }
  };

  const getIcon = () => {
    switch (selectedOption) {
      case "eip155:1":
        return require(`../assets/ICON_ETH.png`);
      case "TWT":
        return require(`../assets/ICON_TWT.png`);
      case "URL":
        return require(`../assets/ICON_URL.png`);
      default:
        console.error('Invalid type');
        break;
    }
  };

  const getButtonLabel = () => {
    if (isMemberCheck) {
      return `${checkResult ? "Denounce" : "Endorse"} Member`;
    }

    return  `Report ${checkResult ? "not" : ""} Phisher`;
  };

  const getResultColor = () => {
    if (isMemberCheck) {
      return checkResult ? "#61BA60" : "#FF5056";
    }

    return checkResult ? "#FF5056" : "#61BA60"
  }

  return (
    <Box
      width="100%"
      padding="32px"
      marginTop="10px"
      boxSizing="border-box"
      border="1px solid #D0D5DD"
      borderRadius="10px"
      textAlign="left"
    >
      {isLoading ? (
        <>checking...</>
      ) : (
        <>
          <Box
            width="100%"
            display="flex"
            justifyContent="center"
            alignItems="center"
            paddingBottom="24px"
            borderBottom="1px solid #D0D5DD"
          >
            <Typography
              component="img"
              width="60px"
              height="60px"
              flexShrink="0"
              marginRight="20px"
              src={getIcon()}
              alt=""
            />
            <Typography
              component="span"
              width="100%"
              fontSize="18px"
              fontWeight="700"
              color="#101828"
              textAlign="left"
            >
              {value + " "}
              <Typography
                component="span"
                fontWeight="400"
                color={getResultColor()}
              >
                is {!checkResult && "not"} a registered {isMemberCheck ? 'member' : 'phisher'}.
              </Typography>
            </Typography>
            <Typography
              component="img"
              width="20px"
              height="20px"
              flexShrink="0"
              src={checkResult ? error_icon : success_icon}
              alt=""
            />
          </Box>
          <Typography
            component="p"
            fontSize="16px"
            color="#666F85"
            margin="24px 0"
            textAlign="left"
            lineHeight="24px"
          >
            {invitation
              ? `In case there are multiple reports, you will only see the latest
            one. In doubt about this result, you can take the following actions.`
              : `Currently, Mobymask is an invitation-based network and only the invited can make reports. We plan to onboard more people in the future to be phisher fighters. In case there are multiple reports, you will only see the latest one.`}
          </Typography>
          {invitation && (
            <Button
              {...{
                label: getButtonLabel(),
                active: false,
                onClick: handleReport,
              }}
            />
          )}
        </>
      )}
    </Box>
  );
}

export default ReportInputInfo;
