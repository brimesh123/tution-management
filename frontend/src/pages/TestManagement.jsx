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
  Card,
  Grid,
  Divider,
  Alert,
  Fade,
  useTheme,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  School as SchoolIcon,
  Check as CheckIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Assignment as TestIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

function TestManagement() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  
  // Filters for test list
  const [filters, setFilters] = useState({
    standard: '',
    division: '',
    subject: '',
    type: '',
    fromDate: null,
    toDate: null
  });
  
  // New test form state
  const [newTest, setNewTest] = useState({
    exam: '',
    standards: [],
    divisions: [],
    total_marks: 100,
    max_marks: 100,
    subject: '',
    type: 'board',
    test_date: new Date(),
    description: ''
  });
  
  // Available subjects per standard
  const [subjects, setSubjects] = useState([]);
  
  // Create test dialog steps
  const steps = ['Test Information', 'Class Selection', 'Test Details'];
  const [activeStep, setActiveStep] = useState(0);
  
  // Fetch all tests
  const fetchTests = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.standard) queryParams.append('standard', filters.standard);
      if (filters.division) queryParams.append('division', filters.division);
      if (filters.subject) queryParams.append('subject', filters.subject);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.fromDate) queryParams.append('from_date', filters.fromDate.toISOString().split('T')[0]);
      if (filters.toDate) queryParams.append('to_date', filters.toDate.toISOString().split('T')[0]);
      
      const response = await axios.get(`http://localhost:5000/api/tests?${queryParams}`);
      setTests(response.data.tests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      showAlert('Error fetching tests', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch subjects for selected standards
  const fetchSubjects = async (standards) => {
    try {
      if (!standards || standards.length === 0) {
        setSubjects([]);
        return;
      }
      
      // For simplicity, just use the first selected standard
      const standard = standards[0];
      
      const response = await axios.get(`http://localhost:5000/api/subjects?standard=${standard}`);
      setSubjects(response.data.subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };
  
  // Show alert message
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };
  
  // Handle step navigation in create test dialog
  const handleNext = () => {
    // Validate current step
    if (activeStep === 0) {
      if (!newTest.exam || !newTest.type) {
        showAlert('Please fill in all required fields', 'error');
        return;
      }
    } else if (activeStep === 1) {
      if (newTest.standards.length === 0 || newTest.divisions.length === 0) {
        showAlert('Please select at least one standard and division', 'error');
        return;
      }
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTest((prev) => ({ ...prev, [name]: value }));
    
    // If standards changed, fetch subjects
    if (name === 'standards') {
      fetchSubjects(value);
    }
  };
  
  // Handle date change
  const handleDateChange = (date) => {
    setNewTest((prev) => ({ ...prev, test_date: date }));
  };
  
  // Create new test
  const handleCreateTest = async () => {
    try {
      const token = localStorage.getItem('token'); // Get the auth token
      // Format test_date as YYYY-MM-DD
      const formattedDate = newTest.test_date.toISOString().split('T')[0];
      
      const response = await axios.post(
        'http://localhost:5000/api/tests/create',
        {
          ...newTest,
          test_date: formattedDate,
          standards: newTest.standards.join(','),
          divisions: newTest.divisions.join(',')
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      showAlert('Test created successfully');
      setOpenCreateDialog(false);
      fetchTests();
      
      // Reset form
      setNewTest({
        exam: '',
        standards: [],
        divisions: [],
        total_marks: 100,
        max_marks: 100,
        subject: '',
        type: 'board',
        test_date: new Date(),
        description: ''
      });
      setActiveStep(0);
    } catch (error) {
      console.error('Error creating test:', error);
      showAlert('Error creating test', 'error');
    }
  };
  
  
  // Delete test
  const handleDeleteTest = async () => {
    try {
      const token = localStorage.getItem('token'); // Get the auth token
      await axios.delete(`http://localhost:5000/api/tests/${selectedTest.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showAlert('Test deleted successfully');
      setOpenDeleteDialog(false);
      fetchTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      showAlert('Error deleting test', 'error');
    }
  };
  
  // Apply filters
  const handleApplyFilters = () => {
    fetchTests();
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      standard: '',
      division: '',
      subject: '',
      type: '',
      fromDate: null,
      toDate: null
    });
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchTests();
  }, []);
  
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
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Test Management
            </Typography>
            <Chip 
              icon={<TestIcon />}
              label="Manage Tests & Exams"
              color="primary"
              variant="outlined"
            />
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Create New Test
          </Button>
        </Box>
        
        {/* Filter Card */}
        <Card sx={{ mb: 3, p: 2, borderRadius: 2, boxShadow: theme.shadows[2] }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Filter Tests
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Standard</InputLabel>
                <Select
                  value={filters.standard}
                  label="Standard"
                  onChange={(e) => setFilters({ ...filters, standard: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="9">9</MenuItem>
                  <MenuItem value="10">10</MenuItem>
                  <MenuItem value="11">11</MenuItem>
                  <MenuItem value="12">12</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Division</InputLabel>
                <Select
                  value={filters.division}
                  label="Division"
                  onChange={(e) => setFilters({ ...filters, division: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="A">A</MenuItem>
                  <MenuItem value="B">B</MenuItem>
                  <MenuItem value="C">C</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Test Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Test Type"
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="JEE">JEE</MenuItem>
                  <MenuItem value="NEET">NEET</MenuItem>
                  <MenuItem value="board">Board</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Subject"
                fullWidth
                size="small"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ width: '50%' }}>
                  <DatePicker
                    selected={filters.fromDate}
                    onChange={(date) => setFilters({ ...filters, fromDate: date })}
                    placeholderText="From Date"
                    dateFormat="yyyy-MM-dd"
                    customInput={<TextField fullWidth size="small" label="From Date" />}
                  />
                </Box>
                <Box sx={{ width: '50%' }}>
                  <DatePicker
                    selected={filters.toDate}
                    onChange={(date) => setFilters({ ...filters, toDate: date })}
                    placeholderText="To Date"
                    dateFormat="yyyy-MM-dd"
                    customInput={<TextField fullWidth size="small" label="To Date" />}
                  />
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 2, height: '100%', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleApplyFilters}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleResetFilters}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Reset
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="All Tests" />
            <Tab label="Upcoming Tests" />
            <Tab label="Past Tests" />
          </Tabs>
        </Box>
        
        {/* Test Table */}
        <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[2], overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Exam Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Standard</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Division</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Marks</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No tests found. Create a new test to get started.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenCreateDialog(true)}
                        sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
                      >
                        Create New Test
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  tests.map((test) => (
                    <TableRow key={test.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TestIcon color="primary" fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {test.exam}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{test.subject}</TableCell>
                      <TableCell>
                        <Chip 
                          label={test.type} 
                          size="small"
                          color={
                            test.type === 'JEE' ? 'primary' :
                            test.type === 'NEET' ? 'secondary' :
                            test.type === 'board' ? 'success' : 'default'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{test.standards}</TableCell>
                      <TableCell>{test.divisions}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon fontSize="small" color="action" />
                          {new Date(test.test_date).toLocaleDateString()}
                        </Box>
                      </TableCell>
                      <TableCell>{test.total_marks}/{test.max_marks || 100}</TableCell>
                      <TableCell>
                        <IconButton 
                          color="primary"
                          onClick={() => {
                            // Navigate to mark entry or test detail page
                            window.location.href = `/dashboard/results/test/${test.id}`;
                          }}
                        >
                          <AssignmentIcon />
                        </IconButton>
                        <IconButton 
                          color="error"
                          onClick={() => {
                            setSelectedTest(test);
                            setOpenDeleteDialog(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </Box>
      
      {/* Create Test Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon color="primary" />
            <Typography variant="h6">Create New Test</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Exam Name"
                  name="exam"
                  value={newTest.exam}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Test Type</InputLabel>
                  <Select
                    name="type"
                    value={newTest.type}
                    label="Test Type"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="JEE">JEE</MenuItem>
                    <MenuItem value="NEET">NEET</MenuItem>
                    <MenuItem value="board">Board Exam</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description (Optional)"
                  name="description"
                  value={newTest.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          )}
          
          {activeStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Standard(s)</InputLabel>
                  <Select
                    name="standards"
                    multiple
                    value={newTest.standards}
                    onChange={handleInputChange}
                    input={<OutlinedInput label="Standard(s)" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="9">9</MenuItem>
                    <MenuItem value="10">10</MenuItem>
                    <MenuItem value="11">11</MenuItem>
                    <MenuItem value="12">12</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Division(s)</InputLabel>
                  <Select
                    name="divisions"
                    multiple
                    value={newTest.divisions}
                    onChange={handleInputChange}
                    input={<OutlinedInput label="Division(s)" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
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
          )}
          
          {activeStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    name="subject"
                    value={newTest.subject}
                    label="Subject"
                    onChange={handleInputChange}
                  >
                 {subjects.length > 0 ? (
  subjects.map((subject) => (
    <MenuItem key={subject.id} value={subject.subject_name}>
      {subject.subject_name}
    </MenuItem>
  ))
) : ([
  <MenuItem key="Mathematics" value="Mathematics">Mathematics</MenuItem>,
  <MenuItem key="Physics" value="Physics">Physics</MenuItem>,
  <MenuItem key="Chemistry" value="Chemistry">Chemistry</MenuItem>,
  <MenuItem key="Biology" value="Biology">Biology</MenuItem>,
  <MenuItem key="English" value="English">English</MenuItem>,
  <MenuItem key="Hindi" value="Hindi">Hindi</MenuItem>,
  <MenuItem key="Science" value="Science">Science</MenuItem>,
  <MenuItem key="Social Science" value="Social Science">Social Science</MenuItem>
])}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <DatePicker
                    selected={newTest.test_date}
                    onChange={handleDateChange}
                    dateFormat="yyyy-MM-dd"
                    customInput={<TextField label="Test Date" fullWidth required />}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Total Marks"
                  name="total_marks"
                  type="number"
                  value={newTest.total_marks}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Maximum Marks (Optional)"
                  name="max_marks"
                  type="number"
                  value={newTest.max_marks}
                  onChange={handleInputChange}
                  fullWidth
                  helperText="Default is same as Total Marks"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenCreateDialog(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          {activeStep > 0 && (
            <Button 
              onClick={handleBack}
              sx={{ textTransform: 'none' }}
            >
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={handleNext}
              sx={{ textTransform: 'none' }}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleCreateTest}
              sx={{ textTransform: 'none' }}
            >
              Create Test
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the test "{selectedTest?.exam}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDeleteDialog(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteTest}
            sx={{ textTransform: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default TestManagement;
