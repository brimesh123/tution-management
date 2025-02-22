import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

function SubjectManagement() {
  // State to store subjects grouped by standard (9, 10, 11, 12)
  const [allSubjects, setAllSubjects] = useState({ 9: [], 10: [], 11: [], 12: [] });
  // State to store new subject name for each standard
  const [newSubject, setNewSubject] = useState({ 9: '', 10: '', 11: '', 12: '' });

  // Fetch all subjects from the backend
  const fetchAllSubjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/subjects/all');
      // response.data.subjects should be an array of objects { id, standard, subject_name }
      // Group them by standard
      const grouped = { 9: [], 10: [], 11: [], 12: [] };
      response.data.subjects.forEach((subj) => {
        if (grouped[subj.standard]) {
          grouped[subj.standard].push(subj);
        }
      });
      setAllSubjects(grouped);
    } catch (error) {
      console.error("Error fetching all subjects:", error);
      alert("Error fetching subjects");
    }
  };

  useEffect(() => {
    fetchAllSubjects();
  }, []);

  // Handle adding a new subject for a given standard
  const handleAddSubject = async (std) => {
    const subjectName = newSubject[std].trim();
    if (!subjectName) {
      alert("Please enter a subject name");
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/subjects/add', {
        standard: std,
        subject_name: subjectName
      });
      alert("Subject added successfully!");
      // Clear the text field for this standard
      setNewSubject(prev => ({ ...prev, [std]: '' }));
      // Re-fetch subjects to update the list
      fetchAllSubjects();
    } catch (error) {
      console.error("Error adding subject:", error);
      alert("Error adding subject");
    }
  };

  // Handle deleting a subject by its id
  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/subjects/${subjectId}`);
      alert("Subject deleted successfully");
      fetchAllSubjects();
    } catch (error) {
      console.error("Error deleting subject:", error);
      alert("Error deleting subject");
    }
  };

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Subject Management
      </Typography>

      {/* Loop over the standards 9, 10, 11, 12 */}
      {[9, 10, 11, 12].map(std => (
        <Box key={std} sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Standard {std}
          </Typography>

          {/* Form to add new subject for this standard */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Subject Name"
              value={newSubject[std]}
              onChange={(e) =>
                setNewSubject(prev => ({ ...prev, [std]: e.target.value }))
              }
              size="small"
            />
            <Button
              variant="contained"
              onClick={() => handleAddSubject(std)}
            >
              Add Subject
            </Button>
          </Box>

          {/* Table displaying subjects for this standard */}
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subject Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allSubjects[std].length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      No subjects found for standard {std}.
                    </TableCell>
                  </TableRow>
                ) : (
                  allSubjects[std].map(subj => (
                    <TableRow key={subj.id}>
                      <TableCell>{subj.id}</TableCell>
                      <TableCell>{subj.subject_name}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleDeleteSubject(subj.id)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      ))}
    </Container>
  );
}

export default SubjectManagement;
