/*
  This file ensures that verbose console logs are disabled in production builds.
  Import it once in the root layout. It keeps logs during development.
*/

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  // Override to noop
  // @ts-ignore – we are intentionally mutating console
  console.log = () => {};
} 