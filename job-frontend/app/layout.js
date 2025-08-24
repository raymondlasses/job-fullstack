'use client';
import { CssBaseline, AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import Link from 'next/link';

export default function RootLayout({ children }) {
  return (
    <html lang="en"><body>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Job Dashboard</Typography>
          <Button color="inherit" component={Link} href="/">Home</Button>
          <Button color="inherit" component={Link} href="/commands">Commands</Button>
          <Button color="inherit" component={Link} href="/crawler">Crawler</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>{children}</Box>
      </Container>
    </body></html>
  );
}
