'use client';
import { DataGrid } from '@mui/x-data-grid';
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, Typography, TextField } from '@mui/material';

export default function ResultsGrid({
  filterType,
  mode = 'results',
  resultId,
  title = 'Results',
  onRowClick,
  refreshAt,
  pollMs = 0,
  selectedResult,
}) {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 100 });
  const [filter, setFilter] = useState('');
  const [fetchKey, setFetchKey] = useState(0);

  const pollRef = useRef(null);
  const lastFetchId = useRef(0);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPoll = (fn) => {
    stopPoll();
    if (pollMs > 0) pollRef.current = setInterval(fn, pollMs);
  };

  const fetchData = async () => {
    const fetchId = ++lastFetchId.current;

    try {
      const { page, pageSize } = paginationModel;
      
      if (mode === 'urls' && !resultId) {
        setRows([]);
        setRowCount(0);
        return;
      }
      
      const params = new URLSearchParams();
      params.set('page', String(page + 1));
      params.set('page_size', String(pageSize));
      if (filterType) params.set('type', filterType);
      if (filter?.trim()) params.set('filter', filter.trim());

      if (refreshAt) params.set('_', String(refreshAt));

      const base =
        mode === 'urls' && resultId
          ? `/api/results/${encodeURIComponent(resultId)}/urls`
          : `/api/results/paged`;

      const url = `${base}?${params.toString()}`;

      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      if (res.status === 404) return;

      const data = await res.json();
      if (data?.status === 'PENDING') return;

      if (fetchId !== lastFetchId.current) return;

      const items = data.results || data.items || [];

      setRows(
        items.map((r) => ({
          id: r.id || r._id,
          ...r,
        }))
      );
      setRowCount(data.total ?? items.length ?? 0);
      setFetchKey((k) => k + 1);

      if (mode === 'urls' && items.length > 0) stopPoll();
    } catch (err) {
      console.error('Failed to fetch results:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    setRows([]);
    fetchData();
    startPoll(() => mounted && fetchData());
    return () => {
      mounted = false;
      stopPoll();
    };
  }, [filterType, mode, resultId, refreshAt, pollMs, paginationModel, filter]);

  const columns =
    mode === 'urls'
      ? [
          { field: 'url', headerName: 'URL', flex: 3 },
          { field: 'timestamp', headerName: 'Timestamp', flex: 2 },
        ]
      : [
          { field: 'type', headerName: 'Type', flex: 1 },
          { field: 'input', headerName: 'Input', flex: 2 },
          { field: 'result', headerName: 'Result', flex: 3 },
          { field: 'timestamp', headerName: 'Timestamp', flex: 2 },
        ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        <TextField
          label="Search"
          size="small"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPaginationModel((prev) => ({ ...prev, page: 0 }));
          }}
          fullWidth
          style={{ marginBottom: 12 }}
        />

        <div style={{ height: 500, width: '100%' }}>
          <DataGrid
            key={fetchKey}
            rows={rows}
            columns={columns}
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            onRowClick={(params) => onRowClick && onRowClick(params.row)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

