'use client';
import { Card, CardContent, Typography } from '@mui/material';
export default function Home() {
  return (
    <Card><CardContent>
      <Typography variant="h5" gutterBottom>Welcome</Typography>
      <Typography gutterBottom>Next.js + MUI frontend.</Typography>
      <Typography>Use the menu in the top right to access OS command output and crawler tools.</Typography>
      <Typography>Click on your crawler result to view paginated and filtered URLs.</Typography>
    </CardContent></Card>
  );
}
