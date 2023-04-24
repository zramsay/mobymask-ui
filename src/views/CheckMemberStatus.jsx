import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ReportInput from "./ReportInput";
function CheckMemberStatus() {
  return (
    <Box
      width="96%"
      maxWidth="960px"
      margin="auto"
      textAlign="center"
      paddingTop={{ xs: 5, sm: 10 }}
    >
      <Typography variant="h3">Check Member Status</Typography>
      <ReportInput isMemberCheck/>
    </Box>
  );
}

export default CheckMemberStatus;
