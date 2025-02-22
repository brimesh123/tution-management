import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Card,
  Grid,
  Divider,
  Alert,
  Fade,
  useTheme,
  Paper
} from '@mui/material';
import { Person as PersonIcon, School as SchoolIcon, Save as SaveIcon, Badge as BadgeIcon, Person as PersonIcon2 } from '@mui/icons-material';
import axios from 'axios';

function AddStudent() {
  const theme = useTheme();
  const [customId, setCustomId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [details, setDetails] = useState('');
  const [parentsDetails, setParentsDetails] = useState('');
  // For standards 9 and 10, subjects will be selected from a list fetched from backend
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  // For standards 11 and 12, use a stream selection instead
  const [stream, setStream] = useState('');
  const [division, setDivision] = useState('');
  const [standard, setStandard] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  // Subjects list fetched from backend for standards 9 and 10
  const [subjectList, setSubjectList] = useState([]);
  
  // Predefined stream options for standard 11 and 12
  const streams = ['Science', 'Commerce', 'Arts'];

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  // Fetch subjects for standards 9 and 10 from backend
  const fetchSubjectsForStandard = async (std) => {
    try {
      const response = await axios.get('http://localhost:5000/api/subjects', {
        params: { standard: std }
      });
      setSubjectList(response.data.subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showAlert("Error fetching subjects", "error");
    }
  };

  // When standard changes, if it's 9 or 10 then fetch the subjects; else clear selection.
  useEffect(() => {
    if (standard === '9' || standard === '10') {
      fetchSubjectsForStandard(standard);
      // Clear stream in case previously selected
      setStream('');
    } else if (standard === '11' || standard === '12') {
      // Clear the subject list and subject selection if stream mode
      setSubjectList([]);
      setSelectedSubjects([]);
    }
  }, [standard]);

  const handleAddStudent = () => {
    // Validate required fields
    if (!customId || !name || !email || !password || !details || !parentsDetails || !division || !standard) {
      showAlert("All fields are required for student", "error");
      return;
    }
    // For standards 9 and 10, require at least one subject; for 11/12 require a stream.
    if ((standard === '9' || standard === '10') && selectedSubjects.length === 0) {
      showAlert("Please select at least one subject", "error");
      return;
    }
    if ((standard === '11' || standard === '12') && !stream) {
      showAlert("Please select a stream", "error");
      return;
    }

    // Prepare the subjects payload: for 9/10, join the selected subjects; for 11/12, use the chosen stream.
    const subjectsPayload = (standard === '9' || standard === '10')
      ? selectedSubjects.join(',')
      : stream;

    axios.post('http://localhost:5000/api/users/add-student', {
      custom_id: customId,
      name,
      email,
      password,
      details,
      parents_details: parentsDetails,
      subjects: subjectsPayload,
      division,
      standard,
    })
    .then((response) => {
      showAlert("Student added successfully!");
      // Clear form fields after successful submission
      setCustomId('');
      setName('');
      setEmail('');
      setPassword('');
      setDetails('');
      setParentsDetails('');
      setSelectedSubjects([]);
      setStream('');
      setDivision('');
      setStandard('');
    })
    .catch((error) => {
      console.error("Error adding student:", error);
      showAlert("Error adding student", "error");
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ position: 'relative', mb: 4 }}>
        {alert.show && (
          <Fade in={alert.show}>
            <Alert
              severity={alert.type}
              sx={{
                position: 'absolute',
                top: -60,
                right: 0,
                left: 0,
                boxShadow: 2,
                borderRadius: 2,
              }}
            >
              {alert.message}
            </Alert>
          </Fade>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Add New Student
          </Typography>
          <Chip 
            icon={<PersonIcon2 />}
            label="Student Registration"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[2] }}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Basic Information Section */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <BadgeIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Basic Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Student ID"
                      fullWidth
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Full Name"
                      fullWidth
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Email"
                      fullWidth
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Password"
                      type="password"
                      fullWidth
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Academic Information Section */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
                  <SchoolIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Academic Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Standard</InputLabel>
                      <Select
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
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Division</InputLabel>
                      <Select
                        value={division}
                        label="Division"
                        onChange={(e) => setDivision(e.target.value)}
                      >
                        <MenuItem value="A">A</MenuItem>
                        <MenuItem value="B">B</MenuItem>
                        <MenuItem value="C">C</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {/* For standard 9 and 10, display multiple subject select */}
                  {(standard === '9' || standard === '10') && (
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Subjects</InputLabel>
                        <Select
                          multiple
                          value={selectedSubjects}
                          onChange={(e) => setSelectedSubjects(e.target.value)}
                          input={<OutlinedInput label="Subjects" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" sx={{ borderRadius: 1 }} />
                              ))}
                            </Box>
                          )}
                        >
                          {subjectList.map((subj) => (
                            <MenuItem key={subj.id} value={subj.subject_name}>
                              {subj.subject_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  {/* For standard 11 and 12, display stream selection */}
                  {(standard === '11' || standard === '12') && (
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Stream</InputLabel>
                        <Select
                          value={stream}
                          label="Stream"
                          onChange={(e) => setStream(e.target.value)}
                        >
                          {streams.map((s) => (
                            <MenuItem key={s} value={s}>
                              {s}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              {/* Additional Details Section */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
                  <PersonIcon2 color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Additional Details
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Student Details"
                      fullWidth
                      multiline
                      rows={4}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Parent's Details"
                      fullWidth
                      multiline
                      rows={4}
                      value={parentsDetails}
                      onChange={(e) => setParentsDetails(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddStudent}
                startIcon={<SaveIcon />}
                sx={{
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Add Student
              </Button>
            </Box>
          </Box>
        </Card>
      </Box>
    </Container>
  );
}

export default AddStudent;
