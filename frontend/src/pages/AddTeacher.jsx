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
  Card,
  Grid,
  Divider,
  Alert,
  Fade,
  useTheme,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Save as SaveIcon,
  Badge as BadgeIcon,
  MenuBook as SubjectIcon
} from '@mui/icons-material';
import axios from 'axios';

function AddTeacher() {
  const theme = useTheme();
  // Auto-generated teacher ID and other fields
  const [teacherId, setTeacherId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [details, setDetails] = useState('');
  // New fields: mobile number (required) and address (optional)
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  // Teaching information
  const [teachingStandard, setTeachingStandard] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [divisions, setDivisions] = useState([]); // multi-select divisions
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  // Show alert helper
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  // Fetch next teacher ID from backend
  const fetchNextTeacherId = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/next-teacher-id');
      setTeacherId(response.data.nextId);
    } catch (error) {
      console.error("Error fetching next teacher id:", error);
      showAlert("Error fetching teacher id", "error");
    }
  };

  // Fetch subject options for the given teaching standard
  const fetchSubjectsForStandard = async (std) => {
    try {
      const response = await axios.get('http://localhost:5000/api/subjects', {
        params: { standard: std }
      });
      setSubjectOptions(response.data.subjects);
    } catch (error) {
      console.error("Error fetching subjects for standard:", error);
      showAlert("Error fetching subject options", "error");
    }
  };

  // When teaching standard changes, fetch subject options and reset subject selection
  useEffect(() => {
    if (teachingStandard) {
      fetchSubjectsForStandard(teachingStandard);
      setSubject('');
    }
  }, [teachingStandard]);

  // On mount, fetch the next teacher ID
  useEffect(() => {
    fetchNextTeacherId();
  }, []);

  // Handle teacher registration submission
  const handleAddTeacher = () => {
    // Validate required fields. Mobile number is required.
    if (
      !teacherId ||
      !name ||
      !email ||
      !password ||
      !details ||
      !teachingStandard ||
      !subject ||
      divisions.length === 0 ||
      !mobileNumber
    ) {
      showAlert("All fields are required (address is optional) for teacher", "error");
      return;
    }

    // Prepare divisions as comma-separated string
    const divisionsPayload = divisions.join(',');
    axios.post('http://localhost:5000/api/users/add-teacher', {
      custom_id: teacherId,
      name,
      email,
      password,
      details,
      subject, // subject selected from the fetched list
      teaching_standard: teachingStandard,
      division: divisionsPayload,
      mobile_number: mobileNumber,
      address, // optional field
    })
      .then(response => {
        showAlert("Teacher added successfully!");
        // Clear form fields
        setName('');
        setEmail('');
        setPassword('');
        setDetails('');
        setSubject('');
        setTeachingStandard('');
        setDivisions([]);
        setSubjectOptions([]);
        setMobileNumber('');
        setAddress('');
        // Refresh teacher id for next registration
        fetchNextTeacherId();
      })
      .catch(error => {
        console.error("Error adding teacher:", error);
        showAlert("Error adding teacher", "error");
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
                borderRadius: 2
              }}
            >
              {alert.message}
            </Alert>
          </Fade>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Add New Teacher
          </Typography>
          <Chip 
            label="Teacher Registration"
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
                      label="Teacher ID"
                      fullWidth
                      value={teacherId}
                      disabled
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
                  {/* New required Mobile Number */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Mobile Number"
                      fullWidth
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  {/* Optional Address */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Address (Optional)"
                      fullWidth
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Teaching Information Section */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
                  <SubjectIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Teaching Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Teaching Standard</InputLabel>
                      <Select
                        value={teachingStandard}
                        label="Teaching Standard"
                        onChange={(e) => setTeachingStandard(e.target.value)}
                      >
                        <MenuItem value="9">9</MenuItem>
                        <MenuItem value="10">10</MenuItem>
                        <MenuItem value="11">11</MenuItem>
                        <MenuItem value="12">12</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {/* Subject selection based on teaching standard */}
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small" disabled={!teachingStandard || subjectOptions.length === 0}>
                      <InputLabel>Subject</InputLabel>
                      <Select
                        value={subject}
                        label="Subject"
                        onChange={(e) => setSubject(e.target.value)}
                      >
                        {subjectOptions.map((subj) => (
                          <MenuItem key={subj.id} value={subj.subject_name}>
                            {subj.subject_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Division(s)</InputLabel>
                      <Select
                        multiple
                        value={divisions}
                        label="Division(s)"
                        onChange={(e) => setDivisions(e.target.value)}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" sx={{ borderRadius: 1 }} />
                            ))}
                          </Box>
                        )}
                      >
                        <MenuItem value="A">A</MenuItem>
                        <MenuItem value="B">B</MenuItem>
                        <MenuItem value="C">C</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              {/* Additional Details Section */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Additional Details
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Teacher Details"
                      fullWidth
                      multiline
                      rows={4}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddTeacher}
                startIcon={<SaveIcon />}
                sx={{
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Add Teacher
              </Button>
            </Box>
          </Box>
        </Card>
      </Box>
    </Container>
  );
}

export default AddTeacher;
