import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  Grid,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Fade,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  IconButton,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import axios from 'axios';

function ResultsManagement() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [test, setTest] = useState(null);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [stats, setStats] = useState({
    totalStudents: 0,
    passedStudents: 0,
    highestMarks: 0,
    lowestMarks: 0,
    averageMarks: 0,
    passPercentage: 0
  });
  
  // Performance options
  const performanceOptions = ['Excellent', 'Good', 'Average', 'Below Average', 'Poor'];
  
  // State for bulk marking
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [bulkResults, setBulkResults] = useState([]);
  
  // Show alert message
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };
  
  // Fetch test details and results
  const fetchTestDetails = async () => {
    setLoading(true);
    try {
      if (!testId) {
        navigate('/dashboard/test-management');
        return;
      }
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/results/test/${testId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTest(response.data.test);
      setResults(response.data.results || []);
      setStats(response.data.stats || {
        totalStudents: 0,
        passedStudents: 0,
        highestMarks: 0,
        lowestMarks: 0,
        averageMarks: 0,
        passPercentage: 0
      });
      
      // Fetch all students for this test's standards and divisions
      await fetchStudents(response.data.test);
    } catch (error) {
      console.error('Error fetching test details:', error);
      showAlert('Error fetching test details', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch students eligible for this test
  const fetchStudents = async (currentTest = test) => {
    try {
      if (!currentTest) return;
      
      // Extract standards and divisions from test
      const standards = currentTest.standards.split(',');
      const divisions = currentTest.divisions.split(',');
      
      const queryParams = new URLSearchParams();
      if (standards.length === 1) {
        queryParams.append('standard', standards[0]);
      }
      if (divisions.length === 1) {
        queryParams.append('division', divisions[0]);
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/users/students?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter students based on standards and divisions if multiple were selected
      let filteredStudents = response.data.students;
      if (standards.length > 1 || divisions.length > 1) {
        filteredStudents = filteredStudents.filter(student => 
          standards.includes(student.standard) && divisions.includes(student.division)
        );
      }
      
      setStudents(filteredStudents);
      
      // Prepare bulk results data (exclude "remarks" since backend no longer accepts it)
      const initialBulkResults = filteredStudents.map(student => {
        const existingResult = results.find(r => r.student_id === student.id);
        return {
          student_id: student.id,
          name: student.name,
          standard: student.standard,
          division: student.division,
          marks: existingResult?.marks || '',
          performance: existingResult?.performance || 'Average',
          resultExists: !!existingResult
        };
      });
      
      setBulkResults(initialBulkResults);
    } catch (error) {
      console.error('Error fetching students:', error);
      showAlert('Error fetching students', 'error');
    }
  };
  
  // Save result for a student
  const saveResult = async (studentId, marks, performance) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/results/add', {
        student_id: studentId,
        test_id: testId,
        marks,
        performance
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showAlert('Result saved successfully');
      fetchTestDetails(); // Refresh the data
    } catch (error) {
      console.error('Error saving result:', error);
      showAlert('Error saving result', 'error');
    }
  };
  
  // Update result for a student
  const updateResult = async (resultId, marks, performance) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/results/${resultId}`, {
        marks,
        performance
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showAlert('Result updated successfully');
      fetchTestDetails(); // Refresh the data
    } catch (error) {
      console.error('Error updating result:', error);
      showAlert('Error updating result', 'error');
    }
  };
  
  // Handle saving bulk results
  const saveBulkResults = async () => {
    try {
      // Validate inputs first
      const invalidEntries = bulkResults.filter(
        r => r.marks !== '' && (isNaN(r.marks) || r.marks < 0 || r.marks > test.total_marks)
      );
      
      if (invalidEntries.length > 0) {
        showAlert('Some marks are invalid. Please check and try again.', 'error');
        return;
      }
      
      // Only send entries with marks filled and remove any "remarks"
      const resultsToSave = bulkResults
        .filter(r => r.marks !== '')
        .map(({ student_id, marks, performance }) => ({
          student_id,
          marks,
          performance
        }));
      
      if (resultsToSave.length === 0) {
        showAlert('No results to save', 'warning');
        return;
      }
      
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/results/bulk-add', {
        test_id: testId,
        results: resultsToSave
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showAlert(`Successfully saved ${resultsToSave.length} results`);
      setOpenBulkDialog(false);
      fetchTestDetails(); // Refresh the data
    } catch (error) {
      console.error('Error saving bulk results:', error);
      showAlert('Error saving bulk results', 'error');
    }
  };
  
  // Handle input change for bulk results
  const handleBulkResultChange = (index, field, value) => {
    const updatedResults = [...bulkResults];
    updatedResults[index][field] = value;
    
    // Auto-determine performance based on marks
    if (field === 'marks' && value !== '') {
      const marks = parseFloat(value);
      const totalMarks = test.total_marks;
      let performance = 'Poor';
      const percentage = (marks / totalMarks) * 100;
      
      if (percentage >= 90) performance = 'Excellent';
      else if (percentage >= 75) performance = 'Good';
      else if (percentage >= 60) performance = 'Average';
      else if (percentage >= 40) performance = 'Below Average';
      
      updatedResults[index].performance = performance;
    }
    
    setBulkResults(updatedResults);
  };
  
  // Auto-fill marks for all students function
  const autoFillMarks = (value) => {
    const parsedValue = value === '' ? '' : parseFloat(value);
    
    if (parsedValue !== '' && (isNaN(parsedValue) || parsedValue < 0 || parsedValue > test.total_marks)) {
      showAlert('Invalid marks value', 'error');
      return;
    }
    
    const updated = bulkResults.map(result => {
      // Skip students who already have results
      if (result.resultExists) return result;
      
      let performance = result.performance;
      if (value !== '') {
        const percentage = (parsedValue / test.total_marks) * 100;
        
        if (percentage >= 90) performance = 'Excellent';
        else if (percentage >= 75) performance = 'Good';
        else if (percentage >= 60) performance = 'Average';
        else if (percentage >= 40) performance = 'Below Average';
        else performance = 'Poor';
      }
      
      return {
        ...result,
        marks: value,
        performance
      };
    });
    
    setBulkResults(updated);
  };
  
  // Initialize the component
  useEffect(() => {
    fetchTestDetails();
  }, [testId]);
  
  // Refresh student list when test data changes
  useEffect(() => {
    if (test) {
      fetchStudents();
    }
  }, [test]);
  
  // Handle auto-fill dialog
  const [openAutoFillDialog, setOpenAutoFillDialog] = useState(false);
  const [autoFillValue, setAutoFillValue] = useState('');
  
  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (!test) {
    return (
      <Container>
        <Alert severity="error">Test not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard/test-management')}
          sx={{ mt: 2 }}
        >
          Back to Test Management
        </Button>
      </Container>
    );
  }
  
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
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard/test-management')}
            sx={{ mb: 2 }}
          >
            Back to Tests
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {test.exam} - {test.subject}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(test.test_date).toLocaleDateString()} | Standards: {test.standards} | Divisions: {test.divisions}
            </Typography>
          </Box>
          <Chip
            label={test.type}
            color={
              test.type === 'JEE' ? 'primary' :
              test.type === 'NEET' ? 'secondary' :
              test.type === 'board' ? 'success' :
              'default'
            }
            size="medium"
          />
        </Box>
        
        {/* Test Information Card */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, borderRadius: 2, boxShadow: theme.shadows[2] }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Test Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Maximum Marks
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {test.total_marks}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Teacher
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {test.teacher_name || 'Not assigned'}
                  </Typography>
                </Grid>
                {test.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {test.description}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, borderRadius: 2, boxShadow: theme.shadows[2], height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Results Summary
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Average Score:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {stats.averageMarks ? stats.averageMarks.toFixed(1) : 0}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.averageMarks / test.total_marks) * 100} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Highest Score:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {stats.highestMarks || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Lowest Score:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {stats.lowestMarks || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Pass Percentage:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {stats.passPercentage || 0}%
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={() => setOpenBulkDialog(true)}
                  startIcon={<AssignmentIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Mark Results in Bulk
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
        
        {/* Results Table */}
        <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[2], overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Student Results
            </Typography>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Standard</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Division</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Marks</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Performance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No results have been recorded yet.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => setOpenBulkDialog(true)}
                        sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
                      >
                        Mark Results
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((result) => {
                    const isPass = result.marks >= (test.total_marks * 0.33);
                    
                    return (
                      <TableRow key={result.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                              {result.student_name?.charAt(0) || 'S'}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {result.student_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{result.standard}</TableCell>
                        <TableCell>{result.division}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {result.marks} / {test.total_marks}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {((result.marks / test.total_marks) * 100).toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={result.performance}
                            size="small"
                            color={
                              result.performance === 'Excellent' ? 'success' :
                              result.performance === 'Good' ? 'primary' :
                              result.performance === 'Average' ? 'info' :
                              result.performance === 'Below Average' ? 'warning' :
                              'error'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={isPass ? <CheckCircleIcon /> : <CancelIcon />}
                            label={isPass ? 'Pass' : 'Fail'}
                            color={isPass ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
      
      {/* Bulk Marking Dialog */}
      <Dialog
        open={openBulkDialog}
        onClose={() => setOpenBulkDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Mark Test Results</Typography>
            <Box>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setOpenAutoFillDialog(true)}
                sx={{ mr: 1, borderRadius: 2, textTransform: 'none' }}
              >
                Auto-Fill Marks
              </Button>
              <Button 
                variant="contained" 
                size="small" 
                onClick={saveBulkResults}
                startIcon={<SaveIcon />}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Save All
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Standard</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Division</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Marks (/{test.total_marks})</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bulkResults.map((result, index) => (
                  <TableRow key={result.student_id} sx={{ bgcolor: result.resultExists ? theme.palette.grey[50] : 'inherit' }}>
                    <TableCell>{result.name}</TableCell>
                    <TableCell>{result.standard}</TableCell>
                    <TableCell>{result.division}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 0, max: test.total_marks }}
                        value={result.marks}
                        onChange={(e) => handleBulkResultChange(index, 'marks', e.target.value)}
                        disabled={result.resultExists}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth disabled={result.resultExists}>
                        <Select
                          value={result.performance}
                          onChange={(e) => handleBulkResultChange(index, 'performance', e.target.value)}
                        >
                          {performanceOptions.map(option => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenBulkDialog(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={saveBulkResults}
            startIcon={<SaveIcon />}
            sx={{ textTransform: 'none' }}
          >
            Save All Results
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Auto-Fill Dialog */}
      <Dialog
        open={openAutoFillDialog}
        onClose={() => setOpenAutoFillDialog(false)}
      >
        <DialogTitle>Auto-Fill Marks</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter a value to fill marks for all students who don't have results yet.
          </Typography>
          <TextField
            type="number"
            label={`Marks (out of ${test.total_marks})`}
            fullWidth
            value={autoFillValue}
            onChange={(e) => setAutoFillValue(e.target.value)}
            inputProps={{ min: 0, max: test.total_marks }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenAutoFillDialog(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              autoFillMarks(autoFillValue);
              setOpenAutoFillDialog(false);
            }}
            sx={{ textTransform: 'none' }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ResultsManagement;
