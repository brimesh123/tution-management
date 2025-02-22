// src/pages/Attendance.jsx
import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Table, TableHead, TableBody, TableRow, TableCell, Paper, Box } from '@mui/material';
import axios from 'axios';

function Attendance() {
  const [date, setDate] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Utility functions to compute today's and yesterday's dates in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getYesterdayDate = () => {
    const yesterday = new Date(Date.now() - 86400000); // subtract one day in milliseconds
    return yesterday.toISOString().split('T')[0];
  };

  const fetchAttendance = (selectedDate) => {
    if (!selectedDate) {
      alert("Please select a date");
      return;
    }
    axios
      .get(`http://localhost:5000/api/attendance/day?date=${selectedDate}`)
      .then((response) => {
        console.log("Attendance data fetched:", response.data);
        setAttendanceRecords(response.data.attendance);
      })
      .catch((error) => {
        console.error("Error fetching attendance:", error);
        alert("Error fetching attendance");
      });
  };

  // Handlers for the "Today" and "Yesterday" buttons
  const handleTodayClick = () => {
    const today = getTodayDate();
    setDate(today);
    fetchAttendance(today);
  };

  const handleYesterdayClick = () => {
    const yesterday = getYesterdayDate();
    setDate(yesterday);
    fetchAttendance(yesterday);
  };

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Attendance for the Day
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          label="Select Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button variant="contained" onClick={() => fetchAttendance(date)}>
          Fetch Attendance
        </Button>
        <Button variant="outlined" onClick={handleTodayClick}>
          Today
        </Button>
        <Button variant="outlined" onClick={handleYesterdayClick}>
          Yesterday
        </Button>
      </Box>
      <Paper sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Standard</TableCell>
              <TableCell>Division</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendanceRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.student_id}</TableCell>
                <TableCell>{record.name}</TableCell>
                <TableCell>{record.standard}</TableCell>
                <TableCell>{record.division}</TableCell>
                <TableCell>{record.attendance_date}</TableCell>
                <TableCell>{record.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}

export default Attendance;
