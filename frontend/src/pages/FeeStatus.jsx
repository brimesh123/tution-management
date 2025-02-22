// src/pages/FeeStatus.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper, Box } from '@mui/material';
import axios from 'axios';

function FeeStatus() {
  console.log("FeeStatus component rendered");
  const [fees, setFees] = useState([]);
  const studentId = 1; // Demo student ID

  useEffect(() => {
    console.log("Fetching fee status for student:", studentId);
    axios.get(`http://localhost:5000/api/fees/student/${studentId}`)
      .then(response => {
        console.log("Fee data fetched:", response.data);
        setFees(response.data.fees);
      })
      .catch(error => {
        console.error("Error fetching fee data:", error);
      });
  }, [studentId]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Fee Status</Typography>
      <Paper sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Fee Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Due Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fees.map(fee => (
              <TableRow key={fee.id}>
                <TableCell>{fee.id}</TableCell>
                <TableCell>{fee.fee_amount}</TableCell>
                <TableCell>{fee.status}</TableCell>
                <TableCell>{fee.due_date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default FeeStatus;
