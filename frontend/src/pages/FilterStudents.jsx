// src/pages/FilterStudents.jsx
import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, FormControl, InputLabel, Select, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';
import axios from 'axios';

function FilterStudents() {
  console.log("FilterStudents component rendered");
  const [standard, setStandard] = useState('');
  const [division, setDivision] = useState('');
  const [students, setStudents] = useState([]);

  const fetchStudents = () => {
    console.log("Fetching students with standard:", standard, "and division:", division);
    axios.get(`http://localhost:5000/api/users/students?standard=${standard}&division=${division}`)
      .then(response => {
        console.log("Filtered students:", response.data);
        setStudents(response.data.students);
      })
      .catch(error => {
        console.error("Error fetching filtered students:", error);
      });
  };

  useEffect(() => {
    if(standard && division) {
      fetchStudents();
    }
  }, [standard, division]);

  return (
    <Container>
      <Typography variant="h5" gutterBottom>Filter Students</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="filter-standard-label">Standard</InputLabel>
          <Select
            labelId="filter-standard-label"
            value={standard}
            label="Standard"
            onChange={(e) => setStandard(e.target.value)}
          >
            <MenuItem value="9">9</MenuItem>
            <MenuItem value="10">10</MenuItem>
            <MenuItem value="11">11</MenuItem>
            <MenuItem value="12">12</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="filter-division-label">Division</InputLabel>
          <Select
            labelId="filter-division-label"
            value={division}
            label="Division"
            onChange={(e) => setDivision(e.target.value)}
          >
            <MenuItem value="A">A</MenuItem>
            <MenuItem value="B">B</MenuItem>
            <MenuItem value="C">C</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Custom ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Standard</TableCell>
              <TableCell>Division</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map(student => (
              <TableRow key={student.id}>
                <TableCell>{student.id}</TableCell>
                <TableCell>{student.custom_id}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.standard}</TableCell>
                <TableCell>{student.division}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}

export default FilterStudents;
