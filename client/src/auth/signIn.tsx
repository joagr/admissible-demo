// Page for submitting an email address to initiate the authentication flow.
// If the email is valid, a temporary pass code is sent to the email address.

import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  Link as RouterLink,
  useNavigate,
} from 'react-router-dom';
import TextField from "@mui/material/TextField";
import { FormEvent, useState } from "react";
import LoadingButton from '@mui/lab/LoadingButton';


export default function SignInPage() {

  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  

  async function signInEmail(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setSendError(false);
    setSending(true);
    const email = new FormData(formEvent.currentTarget).get("email") as string;
    try {
      const response = await fetch("/api/auth/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
        }),
      });
      if (!response.ok) {
        // ex: would not be ok if invalid email was submitted
        setSendError(true);
      } else {
        const responseData = await response.json();
        navigate("/signin/otp", {state: {
          email: email,
          session: responseData.session,
        }});
      }
    } catch (exception) {
      console.error(`Exception initiating auth: ${exception}`);
      setSendError(true);
    } finally {
      setSending(false);
    }
  }


  return (
    <>
      <Stack spacing={2} alignItems="center" margin={1.5}>
        <Container/>
        <Typography variant="h5">
          Sign In
        </Typography>

        <form onSubmit={signInEmail}>
          <Stack spacing={2} margin={1.5}>
            <Typography>
              Enter your email address, and you will be sent a temporary pass code for signing in.
            </Typography>
            <TextField
              label="Email"
              id="email"
              name="email"
              type="email"
              autoFocus
              required
              fullWidth
              sx={{maxWidth: 400}}
              slotProps={{
                htmlInput: {maxLength: 100}
              }}
            />

            {!sendError ? null :
              <Typography>
                There was an error sending the email.
              </Typography>
            }
            
            <div>
              <LoadingButton
                loading={sending}
                type="submit"
                variant="contained"
              >
                Get pass code
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
