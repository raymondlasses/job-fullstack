'use client';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, TextField, Button, Stack, Alert } from '@mui/material';

export default function CommandsPage() {
  const [command, setCommand] = useState('echo hello');
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState('');
  const [output, setOutput] = useState('');
  const pollRef = useRef(null);

  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };

  const run = async () => {
    setOutput('');
    setStatus('Submitting...');
    setTaskId(null);
    stopPoll();

    const res = await fetch('/api/jobs/os', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ command }),
    });

    const data = await res.json();
    setTaskId(data.task_id || null);
    setStatus(data.task_id ? 'PENDING' : 'Submission failed');

    if (!data.task_id) return;

    const poll = async () => {
      try {
        const r = await fetch(`/api/results?task_id=${encodeURIComponent(data.task_id)}`);
        if (r.status === 404) return;

        const mine = await r.json();
        if (mine && Object.prototype.hasOwnProperty.call(mine, 'result')) {
          setStatus('DONE');
          setOutput(typeof mine.result === 'string' ? mine.result : JSON.stringify(mine.result, null, 2));
          stopPoll();
        }
      } catch (e) {
        console.error('poll error:', e);
      }
    };

    poll(); // run immediately
    pollRef.current = setInterval(poll, 500); // faster interval
  };


  useEffect(() => () => stopPoll(), []);

  return (
    <Stack spacing={2}>
      <Card><CardContent>
        <Typography variant="h5" gutterBottom>Run OS Command</Typography>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
          <TextField fullWidth label="Command" value={command} onChange={e=>setCommand(e.target.value)} />
          <Button variant="contained" onClick={run}>Run</Button>
        </Stack>
        {taskId && <Alert sx={{ mt:2 }} severity="info">Task ID: {taskId} — {status}</Alert>}
        <Typography variant="subtitle1" sx={{ mt:2 }}>Output</Typography>
        <pre style={{ whiteSpace:'pre-wrap', background:'#111', color:'#eee', padding:12, borderRadius:8, minHeight:120 }}>
          {output || '—'}
        </pre>
      </CardContent></Card>
    </Stack>
  );
}

