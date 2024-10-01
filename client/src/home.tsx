// Home page. Fetches the user's sign-in status, and displays
// either the user's signed-in email address, or else a
// "you are not signed in message" with a link for the sign-in page.
// This page also provides a sign-out button, and the function for
// calling the sign-out API endpoint, which clears the user's auth token.

import Container from '@mui/material/Container';
import { default as MuiLink } from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  Link as RouterLink,
} from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import useSWR from "swr";
import {useState} from "react";
import LoadingButton from '@mui/lab/LoadingButton';
import {checkRefreshAccessToken} from "./auth/refresh.ts";


async function fetchAuthEmail(path: string) {
  await checkRefreshAccessToken();
  const result = await fetch(path);
  if (result.status === 403) {
    return null;
  }
  if (result.ok) {
    return result.json();
  }
}


export default function HomePage() {

  const authStatus = useSWR('/api/auth/status', fetchAuthEmail);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/signout");
    await authStatus.mutate();
    setSigningOut(false);
  }

  return (
    <>
      <Stack spacing={2} alignItems="center" margin={1.5}>
        <Container />
        <Typography variant="h5">
          Home Page
        </Typography>
        <Container />

        { authStatus.isLoading ? <CircularProgress />
          : authStatus.error ? hadFetchError()
          : authStatus.data ? signedIn(authStatus.data.email)
          : notSignedIn()
        }

        <MuiLink component={RouterLink} to="/hello" padding={1}>
          View protected Hello message
        </MuiLink>

      </Stack>
    </>
  );

  function hadFetchError() {
    return (
      <Typography>
        Error fetching your sign-in status
      </Typography>
    );
  }

  function notSignedIn() {
    return (
      <Stack spacing={2} alignItems="center" margin={1.5}>
        <Typography>You are not signed in</Typography>
        <Typography textAlign="center">
          <MuiLink component={RouterLink} to="/signin">
            Sign in
          </MuiLink>
        </Typography>
      </Stack>
    );
  }

  function signedIn(email: string) {
    return (
      <Stack spacing={2} alignItems="center" margin={1.5}>
        <Typography>
          You are signed in as {email}
        </Typography>
        <Container />
        <LoadingButton
          onClick={signOut}
          loading={signingOut}
          variant="contained"
        >
          Sign out
        </LoadingButton>
      </Stack>
    );
  }

}
