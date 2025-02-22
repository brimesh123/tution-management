// src/pages/Results.jsx
import React, { useEffect, useState } from 'react';
import { Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper, Box } from '@mui/material';
import axios from 'axios';

function Results() {
  console.log("Results component rendered");
  const [results, setResults] = useState([]);
  const studentId = 1; // Demo student ID

  useEffect(() => {
    console.log("Fetching results for student:", studentId);
    axios.get(`http://localhost:5000/api/results/student/${studentId}`)
      .then(response => {
        console.log("Results fetched:", response.data);
        setResults(response.data.results);
      })
      .catch(error => {
        console.error("Error fetching results:", error);
      });
  }, [studentId]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Test Results</Typography>
      <Paper sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Test ID</TableCell>
              <TableCell>Marks</TableCell>
              <TableCell>Performance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map(result => (
              <TableRow key={result.id}>
                <TableCell>{result.id}</TableCell>
                <TableCell>{result.test_id}</TableCell>
                <TableCell>{result.marks}</TableCell>
                <TableCell>{result.performance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default Results;
