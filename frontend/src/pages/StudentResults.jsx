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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  IconButton,
  TableContainer,
  useTheme,
  LinearProgress,
  Tab,
  Tabs,
  Button,
  Avatar
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  EmojiEvents as TrophyIcon,
  ShowChart as ChartIcon,
  School as SchoolIcon,
  Equalizer as EqualizerIcon,
  Star as StarIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import axios from 'axios';

// Custom chart components
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function StudentResults() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [student, setStudent] = useState(null);
  const [filter, setFilter] = useState({
    subject: '',
    testType: '',
    timeframe: 'all' // 'recent', 'month', 'all'
  });
  
  // Analytics data
  const [analytics, setAnalytics] = useState({
    subjectAverages: [],
    monthlyProgress: [],
    performanceDistribution: [],
    recentResults: []
  });
  
  // Get logged in user data (student)
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  useEffect(() => {
    // Retrieve user info from localStorage
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
  
  // Fetch student results (with auth token)
  const fetchResults = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/results/student/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(response.data.results || []);
      setStudent(response.data.student || null);
      
      generateAnalytics(response.data.results || []);
    } catch (error) {
      console.error('Error fetching results:', error.response?.data || error.message);
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Error fetching your results',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Generate analytics from results
  const generateAnalytics = (resultData) => {
    if (!resultData || resultData.length === 0) {
      setAnalytics({
        subjectAverages: [],
        monthlyProgress: [],
        performanceDistribution: [],
        recentResults: []
      });
      return;
    }
    
    // Subject Averages
    const subjectGroups = {};
    resultData.forEach(result => {
      if (!subjectGroups[result.subject]) {
        subjectGroups[result.subject] = { total: 0, count: 0 };
      }
      subjectGroups[result.subject].total += result.marks;
      subjectGroups[result.subject].count += 1;
    });
    const subjectAverages = Object.keys(subjectGroups).map(subject => ({
      subject,
      average: subjectGroups[subject].total / subjectGroups[subject].count
    }));
    
    // Monthly Progress
    const sortedByDate = [...resultData].sort((a, b) => new Date(a.test_date) - new Date(b.test_date));
    const monthGroups = {};
    sortedByDate.forEach(result => {
      const date = new Date(result.test_date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthGroups[monthYear]) {
        monthGroups[monthYear] = { total: 0, count: 0 };
      }
      monthGroups[monthYear].total += (result.marks / result.total_marks) * 100;
      monthGroups[monthYear].count += 1;
    });
    const monthlyProgress = Object.keys(monthGroups).map(month => ({
      month,
      averagePercentage: monthGroups[month].total / monthGroups[month].count
    }));
    
    // Performance Distribution
    const performanceCount = {
      'Excellent': 0,
      'Good': 0,
      'Average': 0,
      'Below Average': 0,
      'Poor': 0
    };
    resultData.forEach(result => {
      if (performanceCount[result.performance] !== undefined) {
        performanceCount[result.performance] += 1;
      }
    });
    const performanceDistribution = Object.keys(performanceCount).map(label => ({
      label,
      count: performanceCount[label]
    }));
    
    // Recent Results (last 5 tests)
    const recentResults = [...resultData]
      .sort((a, b) => new Date(b.test_date) - new Date(a.test_date))
      .slice(0, 5);
    
    setAnalytics({
      subjectAverages,
      monthlyProgress,
      performanceDistribution,
      recentResults
    });
  };
  
  // Filter functions...
  const getFilteredResults = () => {
    if (!results || results.length === 0) return [];
    let filtered = [...results];
    if (filter.subject) {
      filtered = filtered.filter(result => result.subject === filter.subject);
    }
    if (filter.testType) {
      filtered = filtered.filter(result => result.type === filter.testType);
    }
    if (filter.timeframe === 'recent') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      filtered = filtered.filter(result => new Date(result.test_date) >= threeMonthsAgo);
    } else if (filter.timeframe === 'month') {
      const now = new Date();
      filtered = filtered.filter(result => {
        const testDate = new Date(result.test_date);
        return testDate.getMonth() === now.getMonth() && testDate.getFullYear() === now.getFullYear();
      });
    }
    return filtered.sort((a, b) => new Date(b.test_date) - new Date(a.test_date));
  };
  
  const getFilterOptions = () => {
    const subjects = new Set();
    const testTypes = new Set();
    results.forEach(result => {
      if (result.subject) subjects.add(result.subject);
      if (result.type) testTypes.add(result.type);
    });
    return {
      subjects: Array.from(subjects),
      testTypes: Array.from(testTypes)
    };
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  useEffect(() => {
    if (userId) {
      fetchResults();
    }
  }, [userId]);
  
  const filteredResults = getFilteredResults();
  const filterOptions = getFilterOptions();
  
  const calculateOverallStats = () => {
    if (filteredResults.length === 0) return { average: 0, highest: 0, tests: 0 };
    const totalMarks = filteredResults.reduce((sum, result) => sum + result.marks, 0);
    const totalMaxMarks = filteredResults.reduce((sum, result) => sum + result.total_marks, 0);
    const highestMark = Math.max(...filteredResults.map(r => r.marks));
    return {
      average: (totalMarks / filteredResults.length).toFixed(1),
      averagePercentage: ((totalMarks / totalMaxMarks) * 100).toFixed(1),
      highest: highestMark,
      tests: filteredResults.length
    };
  };
  
  const overallStats = calculateOverallStats();
  
  // Prepare chart data...
  const chartData = {
    subjectPerformance: {
      labels: analytics.subjectAverages.map(item => item.subject),
      datasets: [{
        label: 'Average Score',
        data: analytics.subjectAverages.map(item => item.average),
        backgroundColor: theme.palette.primary.main,
      }]
    },
    monthlyProgress: {
      labels: analytics.monthlyProgress.map(item => {
        const [year, month] = item.month.split('-');
        return `${new Date(year, month - 1).toLocaleString('default', { month: 'short' })} ${year}`;
      }),
      datasets: [{
        label: 'Average Percentage',
        data: analytics.monthlyProgress.map(item => item.averagePercentage),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.4,
        fill: true
      }]
    },
    performanceDistribution: {
      labels: analytics.performanceDistribution.map(item => item.label),
      datasets: [{
        data: analytics.performanceDistribution.map(item => item.count),
        backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#ff9800', '#f44336'],
        borderWidth: 1
      }]
    }
  };
  
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
      <Box sx={{ mb: 4 }}>
        {/* Header with student info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            My Test Results
          </Typography>
          {student && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip icon={<SchoolIcon />} label={`Class ${student.standard}-${student.division}`} variant="outlined" size="small" />
              <Chip icon={<AssignmentIcon />} label={`${filteredResults.length} Tests`} variant="outlined" size="small" />
            </Box>
          )}
        </Box>
        
        {/* Filters and Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 2, borderRadius: 2, boxShadow: theme.shadows[2] }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={filter.subject}
                    label="Subject"
                    onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
                  >
                    <MenuItem value="">All Subjects</MenuItem>
                    {filterOptions.subjects.map(subject => (
                      <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
                  <InputLabel>Test Type</InputLabel>
                  <Select
                    value={filter.testType}
                    label="Test Type"
                    onChange={(e) => setFilter({ ...filter, testType: e.target.value })}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {filterOptions.testTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
                  <InputLabel>Time Period</InputLabel>
                  <Select
                    value={filter.timeframe}
                    label="Time Period"
                    onChange={(e) => setFilter({ ...filter, timeframe: e.target.value })}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="recent">Last 3 Months</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2, borderRadius: 2, boxShadow: theme.shadows[2], height: '100%', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
                  <StarIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Average Score</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {overallStats.average} ({overallStats.averagePercentage}%)
                  </Typography>
                  <LinearProgress variant="determinate" value={parseFloat(overallStats.averagePercentage)} sx={{ height: 6, borderRadius: 3, mt: 0.5 }} />
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
        
        {/* Tabs for different views */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Results" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>
        
        {/* Results Table View */}
        {activeTab === 0 && (
          <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[2], overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                    <TableCell sx={{ fontWeight: 600 }}>Test</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Marks</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Performance</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1" color="text.secondary">No results found with the selected filters.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResults.map((result) => {
                      const isPass = result.marks >= (result.total_marks * 0.33);
                      const percentage = ((result.marks / result.total_marks) * 100).toFixed(1);
                      return (
                        <TableRow key={result.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{result.exam}</Typography>
                              <Chip 
                                label={result.type} 
                                size="small" 
                                sx={{ mt: 0.5, maxWidth: 'fit-content' }}
                                variant="outlined"
                              />
                            </Box>
                          </TableCell>
                          <TableCell>{result.subject}</TableCell>
                          <TableCell>{new Date(result.test_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {result.marks} / {result.total_marks}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {percentage}%
                              </Typography>
                            </Box>
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
        )}
        
        {/* Analytics View */}
        {activeTab === 1 && (
          <>
            {filteredResults.length === 0 ? (
              <Card sx={{ p: 3, borderRadius: 2, boxShadow: theme.shadows[2] }}>
                <Typography variant="body1" align="center" color="text.secondary">
                  No results available to generate analytics. Take some tests to see your performance data.
                </Typography>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {/* Subject Performance Chart */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, borderRadius: 2, boxShadow: theme.shadows[2], height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Subject Performance
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar
                        data={chartData.subjectPerformance}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } }
                        }}
                      />
                    </Box>
                  </Card>
                </Grid>
                
                {/* Monthly Progress Chart */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, borderRadius: 2, boxShadow: theme.shadows[2], height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Progress Over Time
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Line
                        data={chartData.monthlyProgress}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: { beginAtZero: true, max: 100, title: { display: true, text: 'Percentage %' } }
                          }
                        }}
                      />
                    </Box>
                  </Card>
                </Grid>
                
                {/* Performance Distribution */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, borderRadius: 2, boxShadow: theme.shadows[2], height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Performance Distribution
                    </Typography>
                    <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                      <Box sx={{ width: '80%', maxWidth: 300 }}>
                        <Pie
                          data={chartData.performanceDistribution}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'right' } }
                          }}
                        />
                      </Box>
                    </Box>
                  </Card>
                </Grid>
                
                {/* Overall Stats Card */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, borderRadius: 2, boxShadow: theme.shadows[2], height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Performance Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText }}>
                          <Typography variant="body2">Average Score</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {overallStats.average} ({overallStats.averagePercentage}%)
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.success.light, color: theme.palette.success.contrastText }}>
                          <Typography variant="body2">Highest Score</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {overallStats.highest}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.info.light, color: theme.palette.info.contrastText }}>
                          <Typography variant="body2">Tests Taken</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {overallStats.tests}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.warning.light, color: theme.palette.warning.contrastText }}>
                          <Typography variant="body2">Pass Rate</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {filteredResults.filter(r => r.marks >= (r.total_marks * 0.33)).length * 100 / filteredResults.length}%
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              </Grid>
            )}
          </>
        )}
      </Box>
    </Container>
  );
}

export default StudentResults;
