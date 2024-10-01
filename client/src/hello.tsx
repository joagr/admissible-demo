// Page which shows the Hello message from the protected API endpoint.
// If the user is not signed in, the fetch will fail (403)
// and a "no access" message is shown instead.

import Container from '@mui/material/Container';
import { default as MuiLink } from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import useSWR from "swr";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import {checkRefreshAccessToken} from "./auth/refresh.ts";


async function fetchHello(path: string) {
  await checkRefreshAccessToken();
  const result = await fetch(path);
  if (result.status === 403) {
    return "You cannot access the Hello message until you sign in.";
  }
  if (result.ok) {
    return await result.text();
  }
}


export default function ProtectedHello() {

  const hello = useSWR('/api/hello', fetchHello);

  return (
    <>
      <Stack spacing={2} alignItems="center" margin={1.5}>
        <Container />
        <Typography variant="h5">
          Hello Page
        </Typography>
        <Container />
        <Typography>
          Fetching the Hello message from its protected API endpoint
        </Typography>
        <Container />

        { hello.isLoading || hello.isValidating || !hello.data ? <CircularProgress />
          : hello.error ? hadFetchError()
          : helloMessage(hello.data)
        }

        <Container/>
        <Typography textAlign="center">
          Return to
          <MuiLink component={RouterLink} to="/" padding={1}>
            Home Page
          </MuiLink>
        </Typography>
      </Stack>
    </>
  );

  function hadFetchError() {
    return (
      <Typography>
        Error fetching the Hello message
      </Typography>
    );
  }

  function helloMessage(helloText: string) {
    return (
      <Card>
        <CardContent>
          <Typography>
            {helloText}
          </Typography>
        </CardContent>
      </Card>
    );
  }

}
