import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Divider,
  CircularProgress,
  Stack,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Switch,
  Tooltip,
  InputAdornment,
  TableFooter 
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Print as PrintIcon,
  AttachMoney as MoneyIcon,
  LocalAtm as LocalAtmIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { List, ListItem, ListItemText } from '@mui/material';


// Utility function to format date strings
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Utility function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

// Main component
function FeeManagement() {
  const [activeTab, setActiveTab] = useState(0);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear() + '-' + (new Date().getFullYear() + 1));

  // List of current and previous academic years
  const academicYears = [
    new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    (new Date().getFullYear() - 1) + '-' + new Date().getFullYear(),
    (new Date().getFullYear() - 2) + '-' + (new Date().getFullYear() - 1)
  ];

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Show alert
  const showAlert = (message, severity = 'success') => {
    setAlert({ open: true, message, severity });
  };

  // Handle close alert
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <Container maxWidth="lg">
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="600">
          Fee Management
        </Typography>
        <Grid container spacing={2} mb={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={academicYear}
                label="Academic Year"
                onChange={(e) => setAcademicYear(e.target.value)}
              >
                {academicYears.map((year) => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label="Fee Structures" 
            icon={<MoneyIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="Student Fees" 
            icon={<SchoolIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="Record Payments" 
            icon={<PaymentIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="Invoices" 
            icon={<ReceiptIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="Reports" 
            icon={<DescriptionIcon />} 
            iconPosition="start" 
          />
        </Tabs>

        {/* Fee Structures Tab */}
        {activeTab === 0 && <FeeStructuresTab academicYear={academicYear} academicYears={academicYears} showAlert={showAlert} />}
        
        {/* Student Fees Tab */}
        {activeTab === 1 && <StudentFeesTab academicYear={academicYear} academicYears={academicYears} showAlert={showAlert} />}
        
        {/* Record Payments Tab */}
        {activeTab === 2 && <PaymentsTab academicYear={academicYear} academicYears={academicYears} showAlert={showAlert} />}
        
        {/* Invoices Tab */}
        {activeTab === 3 && <InvoicesTab academicYear={academicYear} academicYears={academicYears} showAlert={showAlert} />}
        
        {/* Reports Tab */}
        {activeTab === 4 && <ReportsTab academicYear={academicYear} academicYears={academicYears} showAlert={showAlert} />}
      </Paper>
    </Container>
  );
}

// Fee Structures Tab Component
function FeeStructuresTab({ academicYear,academicYears, showAlert }) {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [formData, setFormData] = useState({
    standard: '',
    fee_name: '',
    amount: '',
    academic_year: academicYear,
    due_date: null,
    is_mandatory: true,
    is_active: true
  });

  // Fetch fee structures
  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/fee-structures', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const filteredStructures = response.data.feeStructures.filter(
        structure => structure.academic_year === academicYear
      );
      
      setStructures(filteredStructures);
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      showAlert('Error fetching fee structures', 'error');
    }
    setLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchFeeStructures();
  }, [academicYear]);

  // Handle dialog open for new fee structure
  const handleOpenDialog = (structure = null) => {
    if (structure) {
      setSelectedStructure(structure);
      setFormData({
        standard: structure.standard,
        fee_name: structure.fee_name,
        amount: structure.amount,
        academic_year: structure.academic_year,
        due_date: structure.due_date ? new Date(structure.due_date) : null,
        is_mandatory: Boolean(structure.is_mandatory),
        is_active: Boolean(structure.is_active)
      });
    } else {
      setSelectedStructure(null);
      setFormData({
        standard: '',
        fee_name: '',
        amount: '',
        academic_year: academicYear,
        due_date: null,
        is_mandatory: true,
        is_active: true
      });
    }
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle date change
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      due_date: date
    });
  };

  // Handle save fee structure
  const handleSaveStructure = async () => {
    // Validate inputs
    if (!formData.standard || !formData.fee_name || !formData.amount || !formData.academic_year) {
      showAlert('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        ...formData,
        due_date: formData.due_date ? formatDate(formData.due_date) : null
      };

      if (selectedStructure) {
        // Update existing structure
        await axios.put(`http://localhost:5000/api/fee-structures/${selectedStructure.id}`, payload, { headers });
        showAlert('Fee structure updated successfully', 'success');
      } else {
        // Create new structure
        await axios.post('http://localhost:5000/api/fee-structures/create', payload, { headers });
        showAlert('Fee structure created successfully', 'success');
      }
      
      handleCloseDialog();
      fetchFeeStructures();
    } catch (error) {
      console.error('Error saving fee structure:', error);
      showAlert('Error saving fee structure', 'error');
    }
    setLoading(false);
  };

  // Handle delete fee structure
  const handleDeleteStructure = async (id) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/fee-structures/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showAlert('Fee structure deleted successfully', 'success');
      fetchFeeStructures();
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      if (error.response && error.response.status === 400) {
        showAlert(error.response.data.message, 'error');
      } else {
        showAlert('Error deleting fee structure', 'error');
      }
    }
    setLoading(false);
  };

  // Group structures by standard
  const structuresByStandard = structures.reduce((acc, structure) => {
    if (!acc[structure.standard]) {
      acc[structure.standard] = [];
    }
    acc[structure.standard].push(structure);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Fee Structures for {academicYear}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Fee Structure
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {Object.keys(structuresByStandard).sort().map((standard) => (
            <Grid item xs={12} key={standard}>
              <Paper elevation={2} sx={{ mb: 2, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Standard {standard}
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fee Name</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Mandatory</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {structuresByStandard[standard].map((structure) => (
                        <TableRow key={structure.id}>
                          <TableCell>{structure.fee_name}</TableCell>
                          <TableCell align="right">{formatCurrency(structure.amount)}</TableCell>
                          <TableCell>{structure.due_date ? formatDate(structure.due_date) : 'N/A'}</TableCell>
                          <TableCell>
                            {structure.is_mandatory ? (
                              <Chip size="small" label="Yes" color="primary" />
                            ) : (
                              <Chip size="small" label="No" />
                            )}
                          </TableCell>
                          <TableCell>
                            {structure.is_active ? (
                              <Chip size="small" label="Active" color="success" />
                            ) : (
                              <Chip size="small" label="Inactive" color="error" />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleOpenDialog(structure)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteStructure(structure.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          ))}

          {Object.keys(structuresByStandard).length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="textSecondary">
                  No fee structures found for the selected academic year.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Add/Edit Fee Structure Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Standard</InputLabel>
                  <Select
                    name="standard"
                    value={formData.standard}
                    onChange={handleInputChange}
                    label="Standard"
                  >
                    {['9', '10', '11', '12'].map((std) => (
                      <MenuItem key={std} value={std}>{std}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Academic Year</InputLabel>
                  <Select
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleInputChange}
                    label="Academic Year"
                  >
                    {academicYears.map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="fee_name"
                  label="Fee Name"
                  fullWidth
                  margin="normal"
                  value={formData.fee_name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="amount"
                  label="Amount"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={formData.amount}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Due Date"
                    value={formData.due_date}
                    onChange={handleDateChange}
                    slotProps={{ textField: { fullWidth: true, margin: "normal" } }}

                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="is_mandatory"
                      checked={formData.is_mandatory}
                      onChange={handleInputChange}
                    />
                  }
                  label="Mandatory"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveStructure} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Student Fees Tab Component
function StudentFeesTab({ academicYear,academicYears, showAlert }) {
  const [loading, setLoading] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState(null);
  const [assignFormData, setAssignFormData] = useState({
    due_date: null,
    notes: ''
  });
  const [bulkFormData, setBulkFormData] = useState({
    standard: '',
    division: '',
    fee_structure_id: '',
    due_date: null
  });
  const [studentFeesData, setStudentFeesData] = useState({});
  const [expandedStudent, setExpandedStudent] = useState(null);

  // Fetch students by standard and division
  const fetchStudents = async () => {
    if (!selectedStandard) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/students', {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          standard: selectedStandard,
          division: selectedDivision 
        }
      });
      
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
      showAlert('Error fetching students', 'error');
    }
    setLoading(false);
  };

  // Fetch fee structures for the selected standard
  const fetchFeeStructures = async (standard) => {
    if (!standard) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/fee-structures/standard/${standard}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { academic_year: academicYear }
      });
      
      setFeeStructures(response.data.feeStructures);
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      showAlert('Error fetching fee structures', 'error');
    }
    setLoading(false);
  };

  // Fetch student fees data
  const fetchStudentFees = async () => {
    if (!selectedStandard) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student-fees/by-class', {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          standard: selectedStandard,
          division: selectedDivision,
          academic_year: academicYear
        }
      });
      
      // Create a map of student_id -> fees data
      const feesMap = {};
      response.data.students.forEach(student => {
        feesMap[student.student_id] = student;
      });
      
      setStudentFeesData(feesMap);
    } catch (error) {
      console.error('Error fetching student fees:', error);
      showAlert('Error fetching student fees', 'error');
    }
    setLoading(false);
  };

  // Effect to load students when standard/division changes
  useEffect(() => {
    if (selectedStandard) {
      fetchStudents();
      fetchFeeStructures(selectedStandard);
      fetchStudentFees();
    }
  }, [selectedStandard, selectedDivision, academicYear]);

  // Handle assigning fee to student
  const handleOpenAssignDialog = (student) => {
    setSelectedStudent(student);
    setAssignFormData({
      due_date: null,
      notes: ''
    });
    setOpenAssignDialog(true);
  };

  // Handle open bulk assign dialog
  const handleOpenBulkDialog = () => {
    setBulkFormData({
      standard: selectedStandard,
      division: selectedDivision,
      fee_structure_id: '',
      due_date: null
    });
    setOpenBulkDialog(true);
  };

  // Handle input change for assign fee form
  const handleAssignInputChange = (e) => {
    const { name, value } = e.target;
    setAssignFormData({
      ...assignFormData,
      [name]: value
    });
  };

  // Handle date change for assign fee form
  const handleAssignDateChange = (date) => {
    setAssignFormData({
      ...assignFormData,
      due_date: date
    });
  };

  // Handle fee structure selection for individual assign
  const handleFeeStructureChange = (e) => {
    const selectedId = e.target.value;
    setSelectedFeeStructure(feeStructures.find(fs => fs.id === parseInt(selectedId)));
  };

  // Handle fee structure selection for bulk assign
  const handleBulkFeeStructureChange = (e) => {
    setBulkFormData({
      ...bulkFormData,
      fee_structure_id: e.target.value
    });
  };

  // Handle bulk input change
  const handleBulkInputChange = (e) => {
    const { name, value } = e.target;
    setBulkFormData({
      ...bulkFormData,
      [name]: value
    });
  };

  // Handle bulk date change
  const handleBulkDateChange = (date) => {
    setBulkFormData({
      ...bulkFormData,
      due_date: date
    });
  };

  // Handle save assigned fee
  const handleSaveAssignedFee = async () => {
    if (!selectedStudent || !selectedFeeStructure) {
      showAlert('Please select a fee structure', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/student-fees/assign', {
        student_id: selectedStudent.id,
        fee_structure_id: selectedFeeStructure.id,
        academic_year: academicYear,
        due_date: assignFormData.due_date ? formatDate(assignFormData.due_date) : null,
        notes: assignFormData.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showAlert('Fee assigned successfully', 'success');
      setOpenAssignDialog(false);
      fetchStudentFees();
    } catch (error) {
      console.error('Error assigning fee:', error);
      showAlert(error.response?.data?.message || 'Error assigning fee', 'error');
    }
    setLoading(false);
  };

  // Handle save bulk assigned fees
  const handleSaveBulkAssign = async () => {
    if (!bulkFormData.fee_structure_id) {
      showAlert('Please select a fee structure', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/student-fees/assign-bulk', {
        standard: bulkFormData.standard,
        division: bulkFormData.division || null,
        fee_structure_id: bulkFormData.fee_structure_id,
        academic_year: academicYear,
        due_date: bulkFormData.due_date ? formatDate(bulkFormData.due_date) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showAlert('Fees assigned in bulk successfully', 'success');
      setOpenBulkDialog(false);
      fetchStudentFees();
    } catch (error) {
      console.error('Error assigning bulk fees:', error);
      showAlert(error.response?.data?.message || 'Error assigning bulk fees', 'error');
    }
    setLoading(false);
  };

  // Toggle expanded student details
  const handleToggleExpand = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Student Fees for {academicYear}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenBulkDialog}
          disabled={!selectedStandard || students.length === 0}
        >
          Bulk Assign Fees
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Standard</InputLabel>
            <Select
              value={selectedStandard}
              label="Standard"
              onChange={(e) => setSelectedStandard(e.target.value)}
            >
              {['9', '10', '11', '12'].map((std) => (
                <MenuItem key={std} value={std}>{std}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Division</InputLabel>
            <Select
              value={selectedDivision}
              label="Division"
              onChange={(e) => setSelectedDivision(e.target.value)}
            >
              <MenuItem value="">All Divisions</MenuItem>
              {['A', 'B', 'C'].map((div) => (
                <MenuItem key={div} value={div}>{div}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchStudents();
              fetchStudentFees();
            }}
            disabled={!selectedStandard}
          >
            Refresh Data
          </Button>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {students.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Std/Div</TableCell>
                    <TableCell align="right">Total Due</TableCell>
                    <TableCell align="right">Amount Paid</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const studentFees = studentFeesData[student.id] || null;
                    const hasFees = studentFees !== null;
                    const isExpanded = expandedStudent === student.id;
                    
                    return (
                      <React.Fragment key={student.id}>
                        <TableRow 
                          hover
                          sx={{ 
                            '&:hover': { cursor: 'pointer' },
                            bgcolor: isExpanded ? 'rgba(0, 0, 0, 0.04)' : 'inherit'
                          }}
                          onClick={() => handleToggleExpand(student.id)}
                        >
                          <TableCell>{student.custom_id}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.standard} - {student.division}</TableCell>
                          <TableCell align="right">
                            {hasFees ? formatCurrency(studentFees.total_due) : 'No fees assigned'}
                          </TableCell>
                          <TableCell align="right">
                            {hasFees ? formatCurrency(studentFees.total_paid) : '-'}
                          </TableCell>
                          <TableCell align="center">
                            {!hasFees ? (
                              <Chip 
                                size="small" 
                                label="Not Assigned" 
                                color="default" 
                              />
                            ) : studentFees.total_paid >= studentFees.total_due ? (
                              <Chip 
                                size="small" 
                                label="Paid" 
                                color="success" 
                                icon={<CheckCircleIcon />} 
                              />
                            ) : studentFees.total_paid > 0 ? (
                              <Chip 
                                size="small" 
                                label="Partially Paid" 
                                color="warning" 
                              />
                            ) : (
                              <Chip 
                                size="small" 
                                label="Unpaid" 
                                color="error" 
                                icon={<CancelIcon />} 
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAssignDialog(student);
                              }}
                            >
                              Assign Fee
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Expanded row to show fee details */}
                        {isExpanded && hasFees && (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ p: 0 }}>
                              <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Fee Details for {student.name}:
                                </Typography>
                                <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Fee Name</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell align="right">Paid</TableCell>
                                        <TableCell align="right">Balance</TableCell>
                                        <TableCell>Due Date</TableCell>
                                        <TableCell>Status</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {studentFees.fees.map((fee) => (
                                        <TableRow key={fee.id}>
                                          <TableCell>{fee.fee_name}</TableCell>
                                          <TableCell align="right">{formatCurrency(fee.total_amount)}</TableCell>
                                          <TableCell align="right">{formatCurrency(fee.paid_amount)}</TableCell>
                                          <TableCell align="right">{formatCurrency(fee.balance)}</TableCell>
                                          <TableCell>{fee.due_date ? formatDate(fee.due_date) : 'N/A'}</TableCell>
                                          <TableCell>
                                            <Chip 
                                              size="small" 
                                              label={fee.status.toUpperCase()} 
                                              color={
                                                fee.status === 'paid' ? 'success' :
                                                fee.status === 'partially_paid' ? 'warning' :
                                                fee.status === 'overdue' ? 'error' : 'default'
                                              }
                                            />
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                {selectedStandard ? 'No students found for the selected criteria.' : 'Please select a standard to view students.'}
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* Assign Fee Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Fee to {selectedStudent?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Fee Structure</InputLabel>
              <Select
                value={selectedFeeStructure?.id || ''}
                onChange={handleFeeStructureChange}
                label="Fee Structure"
              >
                {feeStructures.map((structure) => (
                  <MenuItem key={structure.id} value={structure.id}>
                    {structure.fee_name} - {formatCurrency(structure.amount)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date (Optional)"
                value={assignFormData.due_date}
                onChange={handleAssignDateChange}
                renderInput={(params) => 
                  <TextField {...params} fullWidth margin="normal" />
                }
              />
            </LocalizationProvider>

            <TextField
              name="notes"
              label="Notes (Optional)"
              fullWidth
              margin="normal"
              value={assignFormData.notes}
              onChange={handleAssignInputChange}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveAssignedFee} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Assign Fee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Assign Fees</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              This will assign the selected fee to all students in the specified standard and division.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Standard</InputLabel>
                  <Select
                    name="standard"
                    value={bulkFormData.standard}
                    onChange={handleBulkInputChange}
                    label="Standard"
                  >
                    {['9', '10', '11', '12'].map((std) => (
                      <MenuItem key={std} value={std}>{std}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Division (Optional)</InputLabel>
                  <Select
                    name="division"
                    value={bulkFormData.division}
                    onChange={handleBulkInputChange}
                    label="Division (Optional)"
                  >
                    <MenuItem value="">All Divisions</MenuItem>
                    {['A', 'B', 'C'].map((div) => (
                      <MenuItem key={div} value={div}>{div}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <FormControl fullWidth margin="normal">
              <InputLabel>Fee Structure</InputLabel>
              <Select
                name="fee_structure_id"
                value={bulkFormData.fee_structure_id}
                onChange={handleBulkFeeStructureChange}
                label="Fee Structure"
              >
                {feeStructures.map((structure) => (
                  <MenuItem key={structure.id} value={structure.id}>
                    {structure.fee_name} - {formatCurrency(structure.amount)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date (Optional)"
                value={bulkFormData.due_date}
                onChange={handleBulkDateChange}
                renderInput={(params) => 
                  <TextField {...params} fullWidth margin="normal" />
                }
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveBulkAssign} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Bulk Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Payments Tab Component
// Payments Tab Component with Complete Filtering and Search
function PaymentsTab({ academicYear, academicYears, showAlert }) {
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentFees, setStudentFees] = useState([]);
    const [selectedFee, setSelectedFee] = useState(null);
    const [paymentFormData, setPaymentFormData] = useState({
      amount: '',
      payment_date: new Date(),
      payment_method: 'cash',
      transaction_id: '',
      notes: ''
    });
    const [recentPayments, setRecentPayments] = useState([]);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAllStudents, setShowAllStudents] = useState(false);
    
    // Filters
    const [selectedStandard, setSelectedStandard] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('all');
    const [dateRange, setDateRange] = useState({
      startDate: null,
      endDate: null
    });
  
    // Fetch students by standard and division
    const fetchStudentsByClass = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        let url = 'http://localhost:5000/api/users/students';
        let params = {};
        
        if (selectedStandard) {
          params.standard = selectedStandard;
        }
        
        if (selectedDivision) {
          params.division = selectedDivision;
        }
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          params
        });
        
        setAllStudents(response.data.students || []);
        
        // Filter by search term if provided
        if (searchTerm) {
          const filteredStudents = response.data.students.filter(
            student => student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (student.custom_id && student.custom_id.toLowerCase().includes(searchTerm.toLowerCase()))
          );
          setStudents(filteredStudents);
        } else {
          setStudents(response.data.students || []);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        showAlert('Error fetching students', 'error');
      }
      setLoading(false);
    };
  
    // Fetch all students for dropdown (limit to a reasonable number)
    const fetchAllStudentsForDropdown = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/users/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Store all students but limit the display for performance
        setAllStudents(response.data.students || []);
        
        // Only show in dropdown if search term provided or showAllStudents is true
        if (searchTerm || showAllStudents) {
          const filteredStudents = response.data.students.filter(
            student => student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (student.custom_id && student.custom_id.toLowerCase().includes(searchTerm.toLowerCase()))
          );
          setStudents(filteredStudents);
        } else {
          setStudents([]);
        }
      } catch (error) {
        console.error('Error fetching all students:', error);
        showAlert('Error fetching students', 'error');
      }
      setLoading(false);
    };
  
    // Fetch students for search
    const fetchStudentsBySearch = async (search) => {
      if (!search && !showAllStudents) {
        setStudents([]);
        return;
      }
      
      if (allStudents.length > 0) {
        // If we already have all students, just filter them
        const filteredStudents = allStudents.filter(
          student => student.name.toLowerCase().includes(search.toLowerCase()) || 
                    (student.custom_id && student.custom_id.toLowerCase().includes(search.toLowerCase()))
        );
        setStudents(filteredStudents);
      } else {
        // Otherwise, fetch from server
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get('http://localhost:5000/api/users/students', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setAllStudents(response.data.students || []);
          
          if (search) {
            const filteredStudents = response.data.students.filter(
              student => student.name.toLowerCase().includes(search.toLowerCase()) || 
                        (student.custom_id && student.custom_id.toLowerCase().includes(search.toLowerCase()))
            );
            setStudents(filteredStudents);
          } else if (showAllStudents) {
            setStudents(response.data.students || []);
          }
        } catch (error) {
          console.error('Error fetching students:', error);
          showAlert('Error fetching students', 'error');
        }
        setLoading(false);
      }
    };
  
    // Fetch recent payments with filtering
    const fetchRecentPayments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        // This would require a custom endpoint that supports filtering
        // The endpoint would need to support standard, division, date range, etc.
        let url = 'http://localhost:5000/api/payments/recent';
        let params = {};
        
        if (selectedStandard) {
          params.standard = selectedStandard;
        }
        
        if (selectedDivision) {
          params.division = selectedDivision;
        }
        
        if (dateRange.startDate) {
          params.startDate = formatDate(dateRange.startDate);
        }
        
        if (dateRange.endDate) {
          params.endDate = formatDate(dateRange.endDate);
        }
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          params
        });
        
        setRecentPayments(response.data.payments || []);
      } catch (error) {
        console.error('Error fetching recent payments:', error);
        // Don't show alert for this as it's not critical
      }
      setLoading(false);
    };
  
    // Fetch student fees
    const fetchStudentFees = async (studentId) => {
      if (!studentId) return;
      
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/student-fees/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { academic_year: academicYear }
        });
        
        // Filter by payment status if specified
        let fees = response.data.fees;
        if (paymentStatus !== 'all') {
          fees = fees.filter(fee => {
            if (paymentStatus === 'paid') {
              return fee.status === 'paid';
            } else if (paymentStatus === 'unpaid') {
              return fee.status === 'pending' || fee.status === 'overdue';
            } else if (paymentStatus === 'partial') {
              return fee.status === 'partially_paid';
            }
            return true;
          });
        }
        
        setStudentFees(fees);
      } catch (error) {
        console.error('Error fetching student fees:', error);
        showAlert('Error fetching student fees', 'error');
      }
      setLoading(false);
    };
  
    // Effect to load data on component mount
    useEffect(() => {
      fetchAllStudentsForDropdown();
      fetchRecentPayments();
    }, []);
  
    // Effect to refresh data when filters change
    useEffect(() => {
      if (selectedStandard || selectedDivision) {
        fetchStudentsByClass();
      }
      fetchRecentPayments();
    }, [selectedStandard, selectedDivision, dateRange]);
  
    // Effect to refresh student fees when payment status changes
    useEffect(() => {
      if (selectedStudent) {
        fetchStudentFees(selectedStudent.id);
      }
    }, [paymentStatus, selectedStudent]);
  
    // Handle search input change
    const handleSearchChange = (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      fetchStudentsBySearch(value);
    };
  
    // Handle toggle to show all students
    const handleToggleShowAll = () => {
      setShowAllStudents(!showAllStudents);
      if (!showAllStudents) {
        fetchStudentsBySearch('');
      } else {
        setStudents([]);
      }
    };
  
    // Handle student selection
    const handleStudentSelect = (student) => {
      setSelectedStudent(student);
      fetchStudentFees(student.id);
      setSearchTerm(student.name);
      setStudents([]);  // Clear the search results
    };
  
    // Handle filter changes
    const handleStandardChange = (e) => {
      setSelectedStandard(e.target.value);
      // Reset division when standard changes
      if (!e.target.value) {
        setSelectedDivision('');
      }
    };
  
    const handleDivisionChange = (e) => {
      setSelectedDivision(e.target.value);
    };
  
    const handlePaymentStatusChange = (e) => {
      setPaymentStatus(e.target.value);
    };
  
    const handleDateRangeChange = (field, date) => {
      setDateRange({
        ...dateRange,
        [field]: date
      });
    };
  
    // Handle open payment dialog
    const handleOpenPaymentDialog = (fee) => {
      setSelectedFee(fee);
      setPaymentFormData({
        amount: fee.balance,  // Default to the full balance
        payment_date: new Date(),
        payment_method: 'cash',
        transaction_id: '',
        notes: ''
      });
      setOpenPaymentDialog(true);
    };
  
    // Handle payment input change
    const handlePaymentInputChange = (e) => {
      const { name, value } = e.target;
      setPaymentFormData({
        ...paymentFormData,
        [name]: value
      });
    };
  
    // Handle payment date change
    const handlePaymentDateChange = (date) => {
      setPaymentFormData({
        ...paymentFormData,
        payment_date: date
      });
    };
  
    // Handle save payment
    const handleSavePayment = async () => {
      if (!selectedFee || !paymentFormData.amount || !paymentFormData.payment_date || !paymentFormData.payment_method) {
        showAlert('Please fill in all required fields', 'error');
        return;
      }
  
      if (parseFloat(paymentFormData.amount) <= 0) {
        showAlert('Payment amount must be greater than zero', 'error');
        return;
      }
  
      if (parseFloat(paymentFormData.amount) > parseFloat(selectedFee.balance)) {
        showAlert(`Payment amount cannot exceed balance of ${formatCurrency(selectedFee.balance)}`, 'error');
        return;
      }
  
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:5000/api/payments/add', {
          fee_id: selectedFee.id,
          student_id: selectedStudent.id,
          amount: paymentFormData.amount,
          payment_date: formatDate(paymentFormData.payment_date),
          payment_method: paymentFormData.payment_method,
          transaction_id: paymentFormData.transaction_id,
          notes: paymentFormData.notes
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        showAlert('Payment recorded successfully', 'success');
        setOpenPaymentDialog(false);
        fetchStudentFees(selectedStudent.id);
        fetchRecentPayments();
        
        // Open receipt dialog automatically
        if (response.data.receiptNumber) {
          const newPayment = {
            receipt_number: response.data.receiptNumber,
            student_name: selectedStudent.name,
            custom_id: selectedStudent.custom_id,
            fee_name: selectedFee.fee_name,
            amount: paymentFormData.amount,
            payment_date: formatDate(paymentFormData.payment_date),
            payment_method: paymentFormData.payment_method,
            transaction_id: paymentFormData.transaction_id,
            notes: paymentFormData.notes
          };
          setSelectedPayment(newPayment);
          setOpenReceiptDialog(true);
        }
      } catch (error) {
        console.error('Error recording payment:', error);
        showAlert(error.response?.data?.message || 'Error recording payment', 'error');
      }
      setLoading(false);
    };
  
    // Handle open receipt dialog
    const handleOpenReceiptDialog = async (payment) => {
      setSelectedPayment(payment);
      setOpenReceiptDialog(true);
    };
  
    // Calculate total statistics
    const calculateTotals = () => {
      if (!studentFees.length) return { total: 0, paid: 0, balance: 0 };
      
      return studentFees.reduce((acc, fee) => {
        acc.total += parseFloat(fee.total_amount);
        acc.paid += parseFloat(fee.paid_amount);
        acc.balance += parseFloat(fee.balance);
        return acc;
      }, { total: 0, paid: 0, balance: 0 });
    };
  
    const totals = calculateTotals();
  
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Record & Manage Payments
        </Typography>
  
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="500">
            Payment Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Standard</InputLabel>
                <Select
                  value={selectedStandard}
                  label="Standard"
                  onChange={handleStandardChange}
                >
                  <MenuItem value="">All Standards</MenuItem>
                  {['9', '10', '11', '12'].map((std) => (
                    <MenuItem key={std} value={std}>{std}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Division</InputLabel>
                <Select
                  value={selectedDivision}
                  label="Division"
                  onChange={handleDivisionChange}
                  disabled={!selectedStandard}
                >
                  <MenuItem value="">All Divisions</MenuItem>
                  {['A', 'B', 'C'].map((div) => (
                    <MenuItem key={div} value={div}>{div}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="From Date"
                  value={dateRange.startDate}
                  onChange={(date) => handleDateRangeChange('startDate', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="To Date"
                  value={dateRange.endDate}
                  onChange={(date) => handleDateRangeChange('endDate', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  minDate={dateRange.startDate}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="outlined" 
                fullWidth
                startIcon={<RefreshIcon />}
                onClick={() => {
                  fetchStudentsByClass();
                  fetchRecentPayments();
                }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>
  
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="500">
                  Find Student
                </Typography>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={showAllStudents} 
                      onChange={handleToggleShowAll}
                      size="small"
                    />
                  }
                  label="Show All Students"
                />
              </Box>
              <TextField
                label="Search student by name or ID"
                fullWidth
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              {(students.length > 0 || loading) && (
                <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <List dense>
                      {students.map((student) => (
                        <ListItem 
                        key={student.id} 
                        component="div"
                        button 
                        onClick={() => handleStudentSelect(student)}
                        sx={{ py: 0.5 }}
                      >
                        <ListItemText 
                          primary={
                            <Typography variant="body2" fontWeight="medium">
                              {student.name} ({student.custom_id})
                            </Typography>
                          }
                          secondary={`Standard: ${student.standard}-${student.division}`}
                        />
                      </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              )}
            </Paper>
  
            {selectedStudent && (
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="500">
                      {selectedStudent.name} 
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {selectedStudent.custom_id} | Standard: {selectedStudent.standard}-{selectedStudent.division}
                    </Typography>
                  </Box>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Payment Status</InputLabel>
                    <Select
                      value={paymentStatus}
                      label="Payment Status"
                      onChange={handlePaymentStatusChange}
                      size="small"
                    >
                      <MenuItem value="all">All Fees</MenuItem>
                      <MenuItem value="unpaid">Unpaid Only</MenuItem>
                      <MenuItem value="partial">Partially Paid</MenuItem>
                      <MenuItem value="paid">Fully Paid</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
  
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  studentFees.length > 0 ? (
                    <>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Fee Name</TableCell>
                              <TableCell align="right">Total</TableCell>
                              <TableCell align="right">Paid</TableCell>
                              <TableCell align="right">Balance</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell align="center">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {studentFees.map((fee) => (
                              <TableRow key={fee.id}>
                                <TableCell>{fee.fee_name}</TableCell>
                                <TableCell align="right">{formatCurrency(fee.total_amount)}</TableCell>
                                <TableCell align="right">{formatCurrency(fee.paid_amount)}</TableCell>
                                <TableCell align="right">{formatCurrency(fee.balance)}</TableCell>
                                <TableCell>
                                  <Chip 
                                    size="small" 
                                    label={fee.status.replace('_', ' ').toUpperCase()} 
                                    color={
                                      fee.status === 'paid' ? 'success' :
                                      fee.status === 'partially_paid' ? 'warning' :
                                      fee.status === 'overdue' ? 'error' : 'default'
                                    }
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  {parseFloat(fee.balance) > 0 ? (
                                    <Button
                                      size="small"
                                      startIcon={<PaymentIcon />}
                                      onClick={() => handleOpenPaymentDialog(fee)}
                                      color="primary"
                                      variant="contained"
                                      sx={{ textTransform: 'none' }}
                                    >
                                      Pay
                                    </Button>
                                  ) : (
                                    <Chip 
                                      size="small" 
                                      label="Paid" 
                                      color="success"
                                      icon={<CheckCircleIcon />}
                                    />
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={1} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.total)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.paid)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.balance)}</TableCell>
                              <TableCell colSpan={2}></TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </TableContainer>
  
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" fontWeight="500" gutterBottom>
                          Payment History:
                        </Typography>
                        {studentFees.some(fee => fee.payments && fee.payments.length > 0) ? (
                          <TableContainer sx={{ maxHeight: 200 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Receipt No.</TableCell>
                                  <TableCell>Date</TableCell>
                                  <TableCell>Fee</TableCell>
                                  <TableCell align="right">Amount</TableCell>
                                  <TableCell>Method</TableCell>
                                  <TableCell align="center">Receipt</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {studentFees.flatMap(fee => 
                                  fee.payments ? fee.payments.map(payment => (
                                    <TableRow key={payment.id}>
                                      <TableCell>{payment.receipt_number}</TableCell>
                                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                      <TableCell>{fee.fee_name}</TableCell>
                                      <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                                      <TableCell>{payment.payment_method.replace('_', ' ').toUpperCase()}</TableCell>
                                      <TableCell align="center">
                                        <IconButton 
                                          size="small" 
                                          onClick={() => handleOpenReceiptDialog(payment)}
                                          color="primary"
                                        >
                                          <ReceiptIcon fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  )) : []
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No payment history found.
                          </Typography>
                        )}
                      </Box>
                    </>
                  ) : (
                    <Alert severity="info">
                      No fees found for this student for the current academic year.
                    </Alert>
                  )
                )}
              </Paper>
            )}
          </Grid>
  
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                Recent Payments
              </Typography>
              
              {loading && !selectedStudent ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : recentPayments.length > 0 ? (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Receipt No.</TableCell>
                        <TableCell>Student</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="center">View</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.receipt_number}</TableCell>
                          <TableCell>{payment.student_name}</TableCell>
                          <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{formatDate(payment.payment_date)}</TableCell>
                          <TableCell align="center">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenReceiptDialog(payment)}
                              color="primary"
                            >
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No recent payments found.
                  </Typography>
                </Box>
              )}
            </Paper>
  
            {/* Class-wise Fee Summary */}
            {selectedStandard && (
              <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                  Fee Summary for Standard {selectedStandard}{selectedDivision ? `-${selectedDivision}` : ''}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fee Type</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Collected</TableCell>
                        <TableCell align="right">Pending</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* This would need to be populated with data from backend */}
                      <TableRow>
                        <TableCell>Tuition Fee</TableCell>
                        <TableCell align="right">₹250,000</TableCell>
                        <TableCell align="right">₹175,000</TableCell>
                        <TableCell align="right">₹75,000</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Library Fee</TableCell>
                        <TableCell align="right">₹30,000</TableCell>
                        <TableCell align="right">₹24,000</TableCell>
                        <TableCell align="right">₹6,000</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Computer Lab</TableCell>
                        <TableCell align="right">₹45,000</TableCell>
                        <TableCell align="right">₹36,000</TableCell>
                        <TableCell align="right">₹9,000</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>₹325,000</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>₹235,000</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>₹90,000</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DescriptionIcon />}
                    size="small"
                  >
                    Generate Report
                  </Button>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
  
        {/* Payment Dialog */}
        <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              {selectedFee && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    {selectedStudent?.name} ({selectedStudent?.custom_id})
                  </Typography>
                  <Typography variant="body2">
                    Fee: {selectedFee.fee_name} | Balance: {formatCurrency(selectedFee.balance)}
                  </Typography>
                </Alert>
              )}
  
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="amount"
                    label="Payment Amount"
                    type="number"
                    fullWidth
                    margin="normal"
                    value={paymentFormData.amount}
                    onChange={handlePaymentInputChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      name="payment_method"
                      value={paymentFormData.payment_method}
                      onChange={handlePaymentInputChange}
                      label="Payment Method"
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="online">Online Transfer</MenuItem>
                      <MenuItem value="check">Check/Cheque</MenuItem>
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
  
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Payment Date"
                  value={paymentFormData.payment_date}
                  onChange={handlePaymentDateChange}
                  slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
                />
              </LocalizationProvider>
  
              {paymentFormData.payment_method !== 'cash' && (
                <TextField
                  name="transaction_id"
                  label="Transaction ID/Reference"
                  fullWidth
                  margin="normal"
                  value={paymentFormData.transaction_id}
                  onChange={handlePaymentInputChange}
                />
              )}
  
              <TextField
                name="notes"
                label="Notes (Optional)"
                fullWidth
                margin="normal"
                value={paymentFormData.notes}
                onChange={handlePaymentInputChange}
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSavePayment} 
              variant="contained" 
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Record Payment'}
            </Button>
          </DialogActions>
        </Dialog>
  
        {/* Receipt Dialog */}
        <Dialog open={openReceiptDialog} onClose={() => setOpenReceiptDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Payment Receipt</Typography>
              <Box>
                <IconButton onClick={() => window.print()} size="small">
                  <PrintIcon />
                </IconButton>
                <IconButton onClick={() => setOpenReceiptDialog(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedPayment && (
              <Box sx={{ pt: 1 }} id="printable-receipt">
                <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
                  <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                    <IconButton size="small" onClick={() => window.print()}>
                      <PrintIcon />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold">
                      PAYMENT RECEIPT
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      School Management System
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Receipt No:</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedPayment.receipt_number}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Date:</Typography>
                      <Typography variant="body1">
                        {formatDate(selectedPayment.payment_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Student Name:</Typography>
                      <Typography variant="body1">
                        {selectedPayment.student_name || selectedStudent?.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">ID:</Typography>
                      <Typography variant="body1">
                        {selectedPayment.custom_id || selectedStudent?.custom_id}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">Fee Description:</Typography>
                      <Typography variant="body1">
                        {selectedPayment.fee_name || selectedFee?.fee_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Payment Method:</Typography>
                      <Typography variant="body1" textTransform="capitalize">
                        {selectedPayment.payment_method?.replace('_', ' ')}
                      </Typography>
                    </Grid>
                    {selectedPayment.transaction_id && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Transaction ID:</Typography>
                        <Typography variant="body1">
                          {selectedPayment.transaction_id}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">Amount Paid:</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(selectedPayment.amount)}
                    </Typography>
                  </Box>
                  
                  {selectedPayment.notes && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="textSecondary">Notes:</Typography>
                      <Typography variant="body2">{selectedPayment.notes}</Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      This is a computer generated receipt and does not require a signature.
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    );
  }

// Invoices Tab Component
function InvoicesTab({ academicYear, showAlert }) {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentFees, setStudentFees] = useState([]);
  const [selectedFees, setSelectedFees] = useState([]);

  // Fetch invoices by class
  const fetchInvoicesByClass = async () => {
    if (!selectedStandard) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/invoices/by-class/all', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          standard: selectedStandard,
          division: selectedDivision || null,
          academic_year: academicYear
        }
      });
      
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showAlert('Error fetching invoices', 'error');
    }
    setLoading(false);
  };

  // Fetch students for search
  const fetchStudents = async (search) => {
    if (!search || search.length < 2) {
      setStudents([]);
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter students by name or ID containing the search term
      const filteredStudents = response.data.students.filter(
        student => student.name.toLowerCase().includes(search.toLowerCase()) || 
                  (student.custom_id && student.custom_id.toLowerCase().includes(search.toLowerCase()))
      );
      
      setStudents(filteredStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      showAlert('Error fetching students', 'error');
    }
    setLoading(false);
  };

  // Fetch student fees for invoice creation
  const fetchStudentFees = async (studentId) => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/student-fees/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { academic_year: academicYear }
      });
      
      // Filter to only include fees with a balance
      const feesWithBalance = response.data.fees.filter(fee => parseFloat(fee.balance) > 0);
      setStudentFees(feesWithBalance);
    } catch (error) {
      console.error('Error fetching student fees:', error);
      showAlert('Error fetching student fees', 'error');
    }
    setLoading(false);
  };

  // Fetch invoice details
  const fetchInvoiceDetails = async (invoiceId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedInvoice(response.data.invoice);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      showAlert('Error fetching invoice details', 'error');
    }
    setLoading(false);
  };

  // Effect to fetch invoices when filters change
  useEffect(() => {
    if (selectedStandard) {
      fetchInvoicesByClass();
    }
  }, [selectedStandard, selectedDivision, academicYear]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchStudents(value);
  };

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    fetchStudentFees(student.id);
    setSearchTerm(student.name);
    setStudents([]);  // Clear the search results
    setSelectedFees([]);  // Clear any previously selected fees
  };

  // Handle fee selection for invoice
  const handleFeeSelect = (feeId) => {
    if (selectedFees.includes(feeId)) {
      setSelectedFees(selectedFees.filter(id => id !== feeId));
    } else {
      setSelectedFees([...selectedFees, feeId]);
    }
  };

  // Handle create invoice
  const handleCreateInvoice = async () => {
    if (!selectedStudent || selectedFees.length === 0) {
      showAlert('Please select a student and at least one fee', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/invoices/create', {
        student_id: selectedStudent.id,
        fee_ids: selectedFees,
        invoice_date: formatDate(new Date()),
        due_date: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),  // 30 days from now
        notes: `Invoice for ${academicYear}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showAlert('Invoice created successfully', 'success');
      setOpenCreateDialog(false);
      fetchInvoicesByClass();
      
      // Open the new invoice
      if (response.data.invoiceId) {
        fetchInvoiceDetails(response.data.invoiceId);
        setOpenInvoiceDialog(true);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      showAlert(error.response?.data?.message || 'Error creating invoice', 'error');
    }
    setLoading(false);
  };

  // Handle view invoice
  const handleViewInvoice = async (invoiceId) => {
    await fetchInvoiceDetails(invoiceId);
    setOpenInvoiceDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Invoices for {academicYear}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Create Invoice
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Standard</InputLabel>
            <Select
              value={selectedStandard}
              label="Standard"
              onChange={(e) => setSelectedStandard(e.target.value)}
            >
              <MenuItem value="">All Standards</MenuItem>
              {['9', '10', '11', '12'].map((std) => (
                <MenuItem key={std} value={std}>{std}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Division</InputLabel>
            <Select
              value={selectedDivision}
              label="Division"
              onChange={(e) => setSelectedDivision(e.target.value)}
            >
              <MenuItem value="">All Divisions</MenuItem>
              {['A', 'B', 'C'].map((div) => (
                <MenuItem key={div} value={div}>{div}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchInvoicesByClass}
          >
            Refresh Data
          </Button>
        </Grid>
      </Grid>

      {loading && !openCreateDialog && !openInvoiceDialog ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Std/Div</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.student_name}</TableCell>
                    <TableCell>{invoice.standard}-{invoice.division}</TableCell>
                    <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                    <TableCell align="right">{formatCurrency(invoice.total_amount)}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={invoice.status.replace('_', ' ').toUpperCase()} 
                        color={
                          invoice.status === 'paid' ? 'success' :
                          invoice.status === 'partially_paid' ? 'warning' :
                          invoice.status === 'overdue' ? 'error' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<DescriptionIcon />}
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No invoices found. Use the filters above or create a new invoice.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Invoice</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Student
                </Typography>
                <TextField
                  label="Search student by name or ID"
                  fullWidth
                  margin="normal"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                {students.length > 0 && (
                  <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                    <List>
                      {students.map((student) => (
                        <ListItem 
                          key={student.id} 
                          button 
                          onClick={() => handleStudentSelect(student)}
                        >
                          <ListItemText 
                            primary={student.name} 
                            secondary={`ID: ${student.custom_id} | Standard: ${student.standard}-${student.division}`} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                {selectedStudent && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Student Details
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1">{selectedStudent.name}</Typography>
                      <Typography variant="body2">ID: {selectedStudent.custom_id}</Typography>
                      <Typography variant="body2">Standard: {selectedStudent.standard}-{selectedStudent.division}</Typography>
                    </Paper>
                  </Box>
                )}
              </Grid>
            </Grid>

            {selectedStudent && studentFees.length > 0 ? (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Fees to Include in Invoice
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox"></TableCell>
                        <TableCell>Fee Name</TableCell>
                        <TableCell align="right">Balance</TableCell>
                        <TableCell>Due Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentFees.map((fee) => (
                        <TableRow 
                          key={fee.id}
                          hover
                          onClick={() => handleFeeSelect(fee.id)}
                          selected={selectedFees.includes(fee.id)}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox 
                              checked={selectedFees.includes(fee.id)}
                              onChange={() => handleFeeSelect(fee.id)}
                            />
                          </TableCell>
                          <TableCell>{fee.fee_name}</TableCell>
                          <TableCell align="right">{formatCurrency(fee.balance)}</TableCell>
                          <TableCell>{fee.due_date ? formatDate(fee.due_date) : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2">
                    Total Selected: {formatCurrency(
                      studentFees
                        .filter(fee => selectedFees.includes(fee.id))
                        .reduce((sum, fee) => sum + parseFloat(fee.balance), 0)
                    )}
                  </Typography>
                  <Typography variant="body2">
                    {selectedFees.length} of {studentFees.length} fees selected
                  </Typography>
                </Box>
              </Box>
            ) : selectedStudent ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No outstanding fees found for this student.
              </Alert>
            ) : null}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateInvoice} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={loading || selectedFees.length === 0}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={openInvoiceDialog} onClose={() => setOpenInvoiceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Invoice Details</Typography>
            <Box>
              <IconButton onClick={() => window.print()} size="small">
                <PrintIcon />
              </IconButton>
              <IconButton onClick={() => setOpenInvoiceDialog(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : selectedInvoice ? (
            <Box id="printable-invoice" sx={{ pt: 1 }}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h5" fontWeight="bold">
                    INVOICE
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    School Management System
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Invoice No:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedInvoice.invoice_number}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Date:</Typography>
                    <Typography variant="body1">
                      {formatDate(selectedInvoice.invoice_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Due Date:</Typography>
                    <Typography variant="body1">
                      {selectedInvoice.due_date ? formatDate(selectedInvoice.due_date) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Status:</Typography>
                    <Chip 
                      size="small" 
                      label={selectedInvoice.status.replace('_', ' ').toUpperCase()} 
                      color={
                        selectedInvoice.status === 'paid' ? 'success' :
                        selectedInvoice.status === 'partially_paid' ? 'warning' :
                        selectedInvoice.status === 'overdue' ? 'error' : 'default'
                      }
                    />
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Bill To:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedInvoice.student_name}
                    </Typography>
                    <Typography variant="body2">
                      ID: {selectedInvoice.custom_id}
                    </Typography>
                    <Typography variant="body2">
                      Standard: {selectedInvoice.standard}-{selectedInvoice.division}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Fee Details:
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.fee_name}</TableCell>
                            <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(selectedInvoice.total_amount)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
                
                {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Payment History:
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Receipt No</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Method</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedInvoice.payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{payment.receipt_number}</TableCell>
                              <TableCell>{formatDate(payment.payment_date)}</TableCell>
                              <TableCell>{payment.payment_method}</TableCell>
                              <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
                
                {selectedInvoice.notes && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">Notes:</Typography>
                    <Typography variant="body2">{selectedInvoice.notes}</Typography>
                  </Box>
                )}
                
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    This is a computer generated invoice and does not require a signature.
                  </Typography>
                </Box>
              </Paper>
            </Box>
          ) : (
            <Typography>No invoice data available</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

// Reports Tab Component
function ReportsTab({ academicYear, showAlert }) {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('collection_summary');
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [reportData, setReportData] = useState(null);
  
  // Dummy function to simulate report generation
  const generateReport = async () => {
    setLoading(true);
    
    // In a real app, this would call the backend API
    setTimeout(() => {
      // Dummy data
      if (reportType === 'collection_summary') {
        setReportData({
          title: 'Fee Collection Summary',
          period: academicYear,
          standards: selectedStandard ? [selectedStandard] : ['9', '10', '11', '12'],
          division: selectedDivision,
          total_due: 1250000,
          total_collected: 875000,
          collection_percentage: 70,
          standard_wise: [
            { standard: '9', total_due: 300000, collected: 240000, percentage: 80 },
            { standard: '10', total_due: 320000, collected: 256000, percentage: 80 },
            { standard: '11', total_due: 350000, collected: 210000, percentage: 60 },
            { standard: '12', total_due: 280000, collected: 169000, percentage: 60.36 }
          ]
        });
      } else if (reportType === 'pending_fees') {
        setReportData({
          title: 'Pending Fees Report',
          period: academicYear,
          standards: selectedStandard ? [selectedStandard] : ['9', '10', '11', '12'],
          division: selectedDivision,
          total_pending: 375000,
          students_with_dues: 42,
          students: [
            { id: 1, name: 'Alice Johnson', standard: '9', division: 'A', pending: 12000 },
            { id: 2, name: 'Bob Smith', standard: '10', division: 'B', pending: 15000 },
            { id: 3, name: 'Charlie Brown', standard: '11', division: 'A', pending: 18000 },
            { id: 4, name: 'Diana Ross', standard: '12', division: 'C', pending: 20000 }
          ]
        });
      } else if (reportType === 'payment_history') {
        setReportData({
          title: 'Payment History Report',
          period: academicYear,
          standards: selectedStandard ? [selectedStandard] : ['9', '10', '11', '12'],
          division: selectedDivision,
          total_payments: 875000,
          payment_count: 150,
          monthly_trend: [
            { month: 'Apr', amount: 120000 },
            { month: 'May', amount: 95000 },
            { month: 'Jun', amount: 180000 },
            { month: 'Jul', amount: 220000 },
            { month: 'Aug', amount: 150000 },
            { month: 'Sep', amount: 110000 }
          ]
        });
      }
      
      setLoading(false);
    }, 1500);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Fee Reports
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="collection_summary">Collection Summary</MenuItem>
                <MenuItem value="pending_fees">Pending Fees</MenuItem>
                <MenuItem value="payment_history">Payment History</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Standard</InputLabel>
              <Select
                value={selectedStandard}
                label="Standard"
                onChange={(e) => setSelectedStandard(e.target.value)}
              >
                <MenuItem value="">All Standards</MenuItem>
                {['9', '10', '11', '12'].map((std) => (
                  <MenuItem key={std} value={std}>{std}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Division</InputLabel>
              <Select
                value={selectedDivision}
                label="Division"
                onChange={(e) => setSelectedDivision(e.target.value)}
              >
                <MenuItem value="">All Divisions</MenuItem>
                {['A', 'B', 'C'].map((div) => (
                  <MenuItem key={div} value={div}>{div}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              onClick={generateReport}
              startIcon={loading ? <CircularProgress size={24} /> : <DescriptionIcon />}
              disabled={loading}
              fullWidth
            >
              Generate Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {reportData && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">{reportData.title}</Typography>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Print Report
            </Button>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2">Academic Year: {reportData.period}</Typography>
            <Typography variant="subtitle2">
              Standards: {reportData.standards.join(', ')}
              {reportData.division && ` | Division: ${reportData.division}`}
            </Typography>
          </Box>

          {reportType === 'collection_summary' && (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Total Due</Typography>
                      <Typography variant="h4">{formatCurrency(reportData.total_due)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Total Collected</Typography>
                      <Typography variant="h4">{formatCurrency(reportData.total_collected)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Collection Rate</Typography>
                      <Typography variant="h4">{reportData.collection_percentage}%</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="subtitle1" gutterBottom>Standard-wise Collection</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Standard</TableCell>
                      <TableCell align="right">Total Due</TableCell>
                      <TableCell align="right">Collected</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.standard_wise.map((row) => (
                      <TableRow key={row.standard}>
                        <TableCell>{row.standard}</TableCell>
                        <TableCell align="right">{formatCurrency(row.total_due)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.collected)}</TableCell>
                        <TableCell align="right">{row.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {reportType === 'pending_fees' && (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Total Pending Amount</Typography>
                      <Typography variant="h4">{formatCurrency(reportData.total_pending)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Students with Dues</Typography>
                      <Typography variant="h4">{reportData.students_with_dues}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="subtitle1" gutterBottom>Students with Pending Fees</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Student Name</TableCell>
                      <TableCell>Standard</TableCell>
                      <TableCell>Division</TableCell>
                      <TableCell align="right">Pending Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.id}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.standard}</TableCell>
                        <TableCell>{student.division}</TableCell>
                        <TableCell align="right">{formatCurrency(student.pending)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {reportType === 'payment_history' && (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Total Payments Received</Typography>
                      <Typography variant="h4">{formatCurrency(reportData.total_payments)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Number of Payments</Typography>
                      <Typography variant="h4">{reportData.payment_count}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="subtitle1" gutterBottom>Monthly Payment Trend</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell align="right">Amount Collected</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.monthly_trend.map((item) => (
                      <TableRow key={item.month}>
                        <TableCell>{item.month}</TableCell>
                        <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default FeeManagement;