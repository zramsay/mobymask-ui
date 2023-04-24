import Box from "@mui/material/Box";
import PendingReports from "./PendingReports";
import ReportHistory from "./ReportHistory";
import PendingEndorsements from "./PendingEndorsements";
import MyInviteesBox from "./MyInviteesBox";
import { DISPLAY_ENDORSE_MEMBERS } from "../utils/constants";

function ContentBox() {
  return (
    <Box width="96%" maxWidth="960px" margin="auto">
      <PendingReports />
      {DISPLAY_ENDORSE_MEMBERS && <PendingEndorsements />}
      <ReportHistory />
      <MyInviteesBox />
    </Box>
  );
}

export default ContentBox;
