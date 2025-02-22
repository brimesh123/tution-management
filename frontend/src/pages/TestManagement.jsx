// src/pages/TestManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
} from '@mui/material';
import axios from 'axios';

// Dummy subjects available per standard
const subjectsData = {
  '9': ['Math', 'Science', 'English'],
  '10': ['Math', 'Science', 'English', 'History'],
  '11': ['Math', 'Physics', 'Chemistry', 'Biology', 'English'],
  '12': ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Economics'],
};

function TestManagement() {
  const steps = ['Select/Add Exam', 'Select Standard & Division', 'Enter Test Details'];
  const [activeStep, setActiveStep] = useState(0);
  const [examType, setExamType] = useState('');
  const [customExam, setCustomExam] = useState('');
  const [selectedStandards, setSelectedStandards] = useState([]);
  const [selectedDivisions, setSelectedDivisions] = useState([]);
  const [totalMarks, setTotalMarks] = useState('');
  const [subject, setSubject] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Update available subjects based on a single standard selection for simplicity
  useEffect(() => {
    if (selectedStandards.length === 1) {
      setAvailableSubjects(subjectsData[selectedStandards[0]] || []);
    } else {
      setAvailableSubjects([]);
    }
  }, [selectedStandards]);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    const examName = examType === 'custom' ? customExam : examType;
    axios
      .post('http://localhost:5000/api/tests/create', {
        exam: examName,
        standards: selectedStandards.join(','),
        divisions: selectedDivisions.join(','),
        total_marks: totalMarks,
        subject,
      })
      .then((response) => {
        alert('Test created successfully!');
      })
      .catch((error) => {
        console.error('Error creating test:', error);
        alert('Error creating test');
      });
  };

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Test Management
      </Typography>
      <Stepper activeStep={activeStep} sx={{ mb: 2 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 2 }}>
        {activeStep === 0 && (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel id="exam-select-label">Exam Type</InputLabel>
              <Select
                labelId="exam-select-label"
                value={examType}
                label="Exam Type"
                onChange={(e) => setExamType(e.target.value)}
              >
                <MenuItem value="JEE">JEE</MenuItem>
                <MenuItem value="NEET">NEET</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            {examType === 'custom' && (
              <TextField
                label="Enter Custom Exam Name"
                fullWidth
                margin="normal"
                value={customExam}
                onChange={(e) => setCustomExam(e.target.value)}
              />
            )}
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          </>
        )}

        {activeStep === 1 && (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel id="standards-label">Select Standard(s)</InputLabel>
              <Select
                labelId="standards-label"
                multiple
                value={selectedStandards}
                onChange={(e) => setSelectedStandards(e.target.value)}
                input={<OutlinedInput label="Select Standard(s)" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {['9', '10', '11', '12'].map((std) => (
                  <MenuItem key={std} value={std}>
                    {std}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="divisions-label">Select Division(s)</InputLabel>
              <Select
                labelId="divisions-label"
                multiple
                value={selectedDivisions}
                onChange={(e) => setSelectedDivisions(e.target.value)}
                input={<OutlinedInput label="Select Division(s)" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {['A', 'B', 'C'].map((div) => (
                  <MenuItem key={div} value={div}>
                    {div}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            </Box>
          </>
        )}

        {activeStep === 2 && (
          <>
            <TextField
              label="Total Marks"
              fullWidth
              margin="normal"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="subject-select-label">Select Subject</InputLabel>
              <Select
                labelId="subject-select-label"
                value={subject}
                label="Select Subject"
                onChange={(e) => setSubject(e.target.value)}
              >
                {availableSubjects.map((subj) => (
                  <MenuItem key={subj} value={subj}>
                    {subj}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={handleSubmit}>
                Submit
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}

export default TestManagement;
