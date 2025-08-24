'use client';
import { useRef, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ResultsGrid from '@/components/ResultsGrid';

export default function CrawlerPage() {
  const [seed, setSeed] = useState('https://example.com');
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState('');
  const [refreshAt, setRefreshAt] = useState(null);
  const [viewMode, setViewMode] = useState('history');
  const [selectedResult, setSelectedResult] = useState(null);
  const pollRef = useRef(null);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const run = async () => {
    setStatus('Submitting...');
    setTaskId(null);
    stopPoll();

    try {
      const res = await fetch('/api/jobs/katana', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: seed }),
      });
      const data = await res.json();

      if (!data.task_id) {
        setStatus('Submission failed');
        return;
      }

      setTaskId(data.task_id);
      setStatus('PENDING');

      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/results?task_id=${encodeURIComponent(data.task_id)}`);
          if (r.status === 404) return;

          const resultDoc = await r.json();

          if (resultDoc?.type === 'katana') {
            setStatus('DONE');
            stopPoll();

            setRefreshAt(Date.now());
          }
        } catch (e) {
          console.error('poll error:', e);
        }
      }, 750);
    } catch (err) {
      console.error('job submission failed:', err);
      setStatus('Submission failed');
    }
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Run Crawler (Katana)
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Seed URL"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            />
            <Button variant="contained" onClick={run}>
              Start Crawl
            </Button>
          </Stack>

          {taskId && (
            <Alert sx={{ mt: 2 }} severity="info">
              Task ID: {taskId} — {status}
            </Alert>
          )}
        </CardContent>
      </Card>

      {viewMode === 'history' && (
        <ResultsGrid
          filterType="katana"
          title="Crawl History"
          refreshAt={refreshAt}
          onRowClick={(row) => {
            setSelectedResult(row);
            setViewMode('urls');
          }}
        />
      )}

      {viewMode === 'urls' && selectedResult && (
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                onClick={() => {
                  setViewMode('history');
                  setSelectedResult(null);
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6">
                URLs for {selectedResult.input}
              </Typography>
            </Stack>

            <ResultsGrid
              mode="urls"
              resultId={selectedResult.id || selectedResult._id}
              title="Discovered URLs"
              pollMs={3000}
              selectedResult={selectedResult}
            />
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

