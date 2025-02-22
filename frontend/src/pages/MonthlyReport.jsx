// src/pages/MonthlyReport.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper, Box } from '@mui/material';
import axios from 'axios';

function MonthlyReport() {
  console.log("MonthlyReport component rendered");
  const [report, setReport] = useState([]);
  const studentId = 1; // Demo student ID

  useEffect(() => {
    console.log("Fetching monthly report for student:", studentId);
    axios.get(`http://localhost:5000/api/reports/monthly-average/${studentId}`)
      .then(response => {
        console.log("Monthly report data fetched:", response.data);
        setReport(response.data.report);
      })
      .catch(error => {
        console.error("Error fetching monthly report:", error);
      });
  }, [studentId]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Monthly Average Report</Typography>
      <Paper sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell>Average Marks</TableCell>
              <TableCell>Test Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {report.map(item => (
              <TableRow key={item.month}>
                <TableCell>{item.month}</TableCell>
                <TableCell>{item.average_marks.toFixed(2)}</TableCell>
                <TableCell>{item.test_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default MonthlyReport;
