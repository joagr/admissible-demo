// Functions for checking and refreshing the access token.


/** Checks the expiry on the access token,
 * and refreshes if it has less than 2 minutes left
 * (which includes the case where it has already expired).
 */
export async function checkRefreshAccessToken() {
  const expiry = getExpiry();
  if (!expiry)
    return;
  const now = new Date().getTime();
  const twoMinutes = 2 * 60 * 1000;
  if (expiry - now < twoMinutes) {
    await fetch("/api/auth/refresh");
    const newExpiry = getExpiry();
    console.log(`Refreshed expiry: ${new Date(newExpiry)}`);
  }
}


function getExpiry() {
  const cookies = document.cookie;
  const expiryString = cookies
      .split("; ")
      .find((row) => row.startsWith("accessExpiry="))
      ?.split("=")[1]
    ?? '';
  return Number(expiryString);
}
