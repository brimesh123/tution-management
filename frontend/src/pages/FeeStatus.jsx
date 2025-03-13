import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  TableContainer,
  Tabs,
  Tab,
  LinearProgress,
  Badge,
  Avatar
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Visibility as ViewIcon,
  AccountBalance as BankIcon,
  CalendarToday as CalendarIcon,
  CreditCard as CardIcon,
  LocalAtm as CashIcon,
  Payment as PaymentIcon,
  Star as StarIcon
} from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

// Doughnut and Bar chart for fee summary
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function FeesManagement() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [student, setStudent] = useState(null);
  const [summary, setSummary] = useState({
    totalFees: 0,
    paidFees: 0,
    pendingFees: 0,
    pendingCount: 0
  });
  
  // Dialog states
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [addFeeDialog, setAddFeeDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  
  // Form fields for payment
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date(),
    payment_method: 'cash',
    transaction_id: '',
    remarks: ''
  });
  
  // Form fields for adding new fee
  const [feeForm, setFeeForm] = useState({
    fee_amount: '',
    fee_type: 'tuition',
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)), // Default: 30 days from now
    remarks: ''
  });
  
  // Get logged in user data
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  // Fee type options and payment method options
  const feeTypes = [
    'tuition',
    'examination',
    'laboratory',
    'library',
    'sports',
    'transportation',
    'development',
    'other'
  ];
  const paymentMethods = [
    'cash',
    'cheque',
    'bank_transfer',
    'upi',
    'card',
    'other'
  ];
  
  // Show alert message
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };
  
  // Get current user info from token
  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    setUserRole(role);
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        setUserId(payload.id);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);
  
  // Fetch fee data – make sure your backend has the endpoint /api/fees/student/:userId
  const fetchFees = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/fees/student/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Expect response.data to have keys: fees, student, summary
      setFees(response.data.fees || []);
      setStudent(response.data.student || null);
      setSummary(response.data.summary || {
        totalFees: 0,
        paidFees: 0,
        pendingFees: 0,
        pendingCount: 0
      });
    } catch (error) {
      console.error('Error fetching fees:', error);
      showAlert('Error fetching fee data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle payment of a fee
  const handlePayFee = (fee) => {
    if (userRole !== 'admin') {
      showAlert('Only administrators can record payments', 'error');
      return;
    }
    setSelectedFee(fee);
    setPaymentForm({
      payment_date: new Date(),
      payment_method: 'cash',
      transaction_id: '',
      remarks: ''
    });
    setPaymentDialog(true);
  };
  
  // Submit payment – ensure your backend has /api/fees/:feeId/pay
  const submitPayment = async () => {
    if (!selectedFee) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/fees/${selectedFee.id}/pay`, {
        payment_date: paymentForm.payment_date.toISOString().split('T')[0],
        payment_method: paymentForm.payment_method,
        transaction_id: paymentForm.transaction_id,
        remarks: paymentForm.remarks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert('Payment recorded successfully');
      setPaymentDialog(false);
      fetchFees();
    } catch (error) {
      console.error('Error recording payment:', error);
      showAlert('Error recording payment', 'error');
    }
  };
  
  // Add new fee – ensure your backend has /api/fees/add
  const handleAddFee = async () => {
    if (userRole !== 'admin') {
      showAlert('Only administrators can add fees', 'error');
      return;
    }
    if (!feeForm.fee_amount || !feeForm.fee_type || !feeForm.due_date) {
      showAlert('Please fill all required fields', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/fees/add', {
        student_id: userId,
        fee_amount: parseFloat(feeForm.fee_amount),
        status: 'pending',
        due_date: feeForm.due_date.toISOString().split('T')[0],
        fee_type: feeForm.fee_type,
        remarks: feeForm.remarks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert('Fee added successfully');
      setAddFeeDialog(false);
      setFeeForm({
        fee_amount: '',
        fee_type: 'tuition',
        due_date: new Date(new Date().setDate(new Date().getDate() + 30)),
        remarks: ''
      });
      fetchFees();
    } catch (error) {
      console.error('Error adding fee:', error);
      showAlert('Error adding fee', 'error');
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Filter fees based on active tab
  const getFilteredFees = () => {
    if (!fees || fees.length === 0) return [];
    if (activeTab === 0) return fees;
    if (activeTab === 1) return fees.filter(fee => fee.status === 'pending');
    if (activeTab === 2) return fees.filter(fee => fee.status === 'paid');
    return fees;
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Check if a fee is overdue
  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };
  
  // Get style based on payment status
  const getStatusStyle = (status, dueDate) => {
    if (status === 'paid') {
      return { color: theme.palette.success.main, bgcolor: theme.palette.success.light, icon: <CheckIcon /> };
    } else if (isOverdue(dueDate)) {
      return { color: theme.palette.error.main, bgcolor: theme.palette.error.light, icon: <WarningIcon /> };
    } else {
      return { color: theme.palette.warning.main, bgcolor: theme.palette.warning.light, icon: <CancelIcon /> };
    }
  };
  
  // Prepare chart data for fee distribution by type
  const feeTypeTotals = fees.reduce((acc, fee) => {
    if (!acc[fee.fee_type]) {
      acc[fee.fee_type] = 0;
    }
    acc[fee.fee_type] += parseFloat(fee.fee_amount);
    return acc;
  }, {});
  
  const chartData = {
    fees: {
      labels: ['Paid', 'Pending'],
      datasets: [
        {
          data: [summary.paidFees, summary.pendingFees],
          backgroundColor: [theme.palette.success.main, theme.palette.warning.main],
          borderWidth: 1
        }
      ]
    },
    feeTypes: {
      labels: Object.keys(feeTypeTotals).map(type =>
        type.charAt(0).toUpperCase() + type.slice(1)
      ),
      datasets: [
        {
          label: 'Fee Amount',
          data: Object.values(feeTypeTotals),
          backgroundColor: theme.palette.primary.main
        }
      ]
    }
  };
  
  // On component mount, fetch fees if userId is available
  useEffect(() => {
    if (userId) {
      fetchFees();
    }
  }, [userId]);
  
  const filteredFees = getFilteredFees();
  
  // Calculate overall stats
  const calculateOverallStats = () => {
    if (filteredFees.length === 0) return { average: 0, highest: 0, tests: 0 };
    const totalAmount = filteredFees.reduce((sum, fee) => sum + fee.fee_amount, 0);
    const highestAmount = Math.max(...filteredFees.map(fee => fee.fee_amount));
    return {
      average: (totalAmount / filteredFees.length).toFixed(1),
      averagePercentage: summary.totalFees > 0 ? ((summary.paidFees / summary.totalFees) * 100).toFixed(1) : 0,
      highest: highestAmount,
      tests: filteredFees.length
    };
  };
  
  const overallStats = calculateOverallStats();
  
  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
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
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Fee Status
            </Typography>
            <Chip 
              icon={<MoneyIcon />}
              label="Payments & Due Fees"
              color="primary"
              variant="outlined"
            />
          </Box>
          
          {userRole === 'admin' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setAddFeeDialog(true)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Add New Fee
            </Button>
          )}
        </Box>
        
        {/* Fee Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2, borderRadius: 2, boxShadow: theme.shadows[2], height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 1 }}>
                      <MoneyIcon />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Total Fees
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {formatCurrency(summary.totalFees)}
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2, borderRadius: 2, boxShadow: theme.shadows[2], height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 1 }}>
                      <CheckIcon />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Paid Fees
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                    {formatCurrency(summary.paidFees)}
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2, borderRadius: 2, boxShadow: theme.shadows[2], height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Badge badgeContent={summary.pendingCount} color="error" sx={{ mr: 1 }}>
                      <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                        <WarningIcon />
                      </Avatar>
                    </Badge>
                    <Typography variant="body2" color="text.secondary">
                      Pending Fees
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
                    {formatCurrency(summary.pendingFees)}
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2, borderRadius: 2, boxShadow: theme.shadows[2], height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Payment Status
              </Typography>
              {summary.totalFees > 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', height: 200 }}>
                  <Doughnut
                    data={chartData.fees}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '70%',
                      plugins: { legend: { position: 'bottom' } }
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    No fee records found
                  </Typography>
                  {userRole === 'admin' && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setAddFeeDialog(true)}
                      startIcon={<AddIcon />}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      Add Fee
                    </Button>
                  )}
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
        
        {/* Tabs for different views */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="All Fees" />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Pending
                  {summary.pendingCount > 0 && (
                    <Chip size="small" label={summary.pendingCount} color="error" sx={{ ml: 1 }} />
                  )}
                </Box>
              } 
            />
            <Tab label="Paid" />
          </Tabs>
        </Box>
        
        {/* Fees Table */}
        <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[2], overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Fee Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Payment Details</TableCell>
                  {userRole === 'admin' && <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={userRole === 'admin' ? 6 : 5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No {activeTab === 0 ? '' : activeTab === 1 ? 'pending' : 'paid'} fee records found
                      </Typography>
                      {userRole === 'admin' && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => setAddFeeDialog(true)}
                          sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
                        >
                          Add New Fee
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFees.map((fee) => {
                    const statusStyle = getStatusStyle(fee.status, fee.due_date);
                    const isLate = fee.status === 'pending' && isOverdue(fee.due_date);
                    return (
                      <TableRow key={fee.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                              {fee.fee_type}
                            </Typography>
                            {fee.remarks && (
                              <Typography variant="caption" color="text.secondary">
                                {fee.remarks}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(fee.fee_amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {new Date(fee.due_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                          {isLate && (
                            <Chip label="Overdue" size="small" color="error" sx={{ mt: 0.5 }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={statusStyle.icon}
                            label={fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                            sx={{ color: statusStyle.color, bgcolor: statusStyle.bgcolor }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {fee.status === 'paid' ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {fee.payment_method === 'cash' ? (
                                  <CashIcon fontSize="small" color="action" />
                                ) : fee.payment_method === 'card' ? (
                                  <CardIcon fontSize="small" color="action" />
                                ) : (
                                  <BankIcon fontSize="small" color="action" />
                                )}
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {fee.payment_method?.replace('_', ' ') || 'Not specified'}
                                </Typography>
                              </Box>
                              {fee.payment_date && (
                                <Typography variant="caption" color="text.secondary">
                                  Paid on: {new Date(fee.payment_date).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not paid yet
                            </Typography>
                          )}
                        </TableCell>
                        {userRole === 'admin' && (
                          <TableCell>
                            {fee.status === 'pending' ? (
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<PaymentIcon />}
                                onClick={() => handlePayFee(fee)}
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                              >
                                Record Payment
                              </Button>
                            ) : (
                              <IconButton color="primary" size="small">
                                <ViewIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
        
        {/* Fee Type Distribution Chart */}
        {fees.length > 0 && (
          <Card sx={{ mt: 3, p: 3, borderRadius: 2, boxShadow: theme.shadows[2] }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Fee Distribution by Type
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={chartData.feeTypes}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true } }
                }}
              />
            </Box>
          </Card>
        )}
      </Box>
      
      {/* Payment Dialog */}
      <Dialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {/* Use component="div" to avoid nesting <h6> inside <h2> */}
        <DialogTitle component="div">
          <Typography variant="h6">Record Payment</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 1 }}>
            {selectedFee && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Fee Details
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Fee Type
                        </Typography>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                          {selectedFee.fee_type}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Amount
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {formatCurrency(selectedFee.fee_amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Due Date
                        </Typography>
                        <Typography variant="body1">
                          {new Date(selectedFee.due_date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Payment Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <DatePicker
                      selected={paymentForm.payment_date}
                      onChange={(date) => setPaymentForm({ ...paymentForm, payment_date: date })}
                      dateFormat="yyyy-MM-dd"
                      customInput={
                        <TextField 
                          label="Payment Date" 
                          fullWidth 
                          InputProps={{
                            startAdornment: <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
                          }}
                        />
                      }
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentForm.payment_method}
                      label="Payment Method"
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                      startAdornment={
                        paymentForm.payment_method === 'cash' ? <CashIcon fontSize="small" sx={{ ml: 1, mr: 1, color: 'action.active' }} /> :
                        paymentForm.payment_method === 'card' ? <CardIcon fontSize="small" sx={{ ml: 1, mr: 1, color: 'action.active' }} /> :
                        <BankIcon fontSize="small" sx={{ ml: 1, mr: 1, color: 'action.active' }} />
                      }
                    >
                      {paymentMethods.map(method => (
                        <MenuItem key={method} value={method}>
                          {method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Transaction ID / Reference Number"
                    fullWidth
                    value={paymentForm.transaction_id}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Remarks (Optional)"
                    fullWidth
                    multiline
                    rows={2}
                    value={paymentForm.remarks}
                    onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submitPayment} startIcon={<CheckIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Fee Dialog */}
      <Dialog
        open={addFeeDialog}
        onClose={() => setAddFeeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle component="div">
          <Typography variant="h6">Add New Fee</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fee Amount"
                  type="number"
                  fullWidth
                  required
                  value={feeForm.fee_amount}
                  onChange={(e) => setFeeForm({ ...feeForm, fee_amount: e.target.value })}
                  sx={{ mb: 2 }}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Fee Type</InputLabel>
                  <Select
                    value={feeForm.fee_type}
                    label="Fee Type"
                    onChange={(e) => setFeeForm({ ...feeForm, fee_type: e.target.value })}
                  >
                    {feeTypes.map(type => (
                      <MenuItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <DatePicker
                    selected={feeForm.due_date}
                    onChange={(date) => setFeeForm({ ...feeForm, due_date: date })}
                    dateFormat="yyyy-MM-dd"
                    customInput={<TextField label="Due Date" fullWidth required />}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Remarks (Optional)"
                  fullWidth
                  multiline
                  rows={2}
                  value={feeForm.remarks}
                  onChange={(e) => setFeeForm({ ...feeForm, remarks: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFeeDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAddFee} startIcon={<AddIcon />} sx={{ borderRadius: 2, textTransform: 'none' }}>
            Add Fee
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default FeesManagement;
