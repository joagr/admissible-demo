// Page with prompt for submitting one-time-passcode.

import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import TextField from "@mui/material/TextField";
import {FormEvent, useState} from "react";
import LoadingButton from '@mui/lab/LoadingButton';
import { mutate } from "swr";


export default function OtpPage() {

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string;
  const session = location.state?.session as string;
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);


  const submitOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSendError(false);
    setSending(true);
    const passcode = new FormData(e.currentTarget).get("passcode") as string;
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          otp: passcode.trim(),
          session: session,
        }),
      });
      if (!response.ok) {
        setSendError(true);
      } else {
        // Update this SWR key/value pair, so the home page shows the auth email.
        await mutate("/api/auth/status", {email: email});
        navigate("/");
      }
    } catch (exception) {
      console.error(`Exception submitting passcode: ${exception}`);
      setSendError(true);
    } finally {
      setSending(false);
    }
  };


  return (
    <>
      <Stack spacing={2} alignItems="center" margin={1.5}>
        <Container/>
        <Typography variant="h5">
          Temporary Pass Code
        </Typography>
        <Container/>

        <form onSubmit={submitOtp}>
          <Stack spacing={2} margin={1.5}>
            <Typography>
              Enter the pass code that was sent to {email}
            </Typography>
            <TextField
              label="Pass Code"
              id="passcode"
              name="passcode"
              type="text"
              autoFocus
              required
              fullWidth
              sx={{maxWidth: 400}}
              slotProps={{
                htmlInput: {maxLength: 20}
              }}
            />

            {!sendError ? null :
              <Typography>
                There was an error submitting the passcode.
              </Typography>
            }

            <div>
              <LoadingButton
                loading={sending}
                type="submit"
                variant="contained"
              >
                Submit pass code
              </LoadingButton>
            </div>

          </Stack>
        </form>

        <Container/>
        <Typography textAlign="center">
          Return to
          <Link component={RouterLink} to="/" padding={1}>
            Home Page
          </Link>
        </Typography>
      </Stack>
    </>
  );

}
