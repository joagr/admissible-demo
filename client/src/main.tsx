// The enclosing component of the React web app, referenced by index.html.
// For this demo app, this is where I set up the routes
// using react-router-dom, and the theme using Material-UI.

import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import createTheme from '@mui/material/styles/createTheme';
import {CssBaseline} from "@mui/material";
import HomePage from "./home.tsx";
import HelloPage from "./hello.tsx";
import SignInPage from './auth/signIn.tsx';
import OtpPage from "./auth/otp.tsx";


const router = createBrowserRouter([
  {path: "/", element: <HomePage />,},
  {path: "/hello", element: <HelloPage />},
  {path: "/signin", element: <SignInPage />},
  {path: "/signin/otp",  element: <OtpPage />},
]);

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)
