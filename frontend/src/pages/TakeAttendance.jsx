import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
  Fade,
  CircularProgress,
  Card,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Tabs,
  Tab,
  Grid,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Search as SearchIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

// Helper function: format date as "YYYY-MM-DD"
function formatDateToYMD(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function TakeAttendance() {
  // States for selection and data
  const [standard, setStandard] = useState('');
  const [division, setDivision] = useState('');
  const [date, setDate] = useState(new Date());
  const [students, setStudents] = useState([]); // complete list from users endpoint
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { student_id: status }
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [tabValue, setTabValue] = useState(0); // 0: Remaining, 1: Marked
  const [editModes, setEditModes] = useState({}); // { student_id: boolean } for marked students

  // Show alert message
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  // Check lock status from backend for given standard, division, and date
  const checkAttendanceLock = async (std, div, dateVal) => {
    try {
      const res = await axios.get('http://localhost:5000/api/attendance/check-lock', {
        params: { standard: std, division: div, date: dateVal },
      });
      return res.data.locked;
    } catch (error) {
      console.error('Error checking attendance lock:', error);
      showAlert('Error checking attendance lock', 'error');
      return false;
    }
  };

  // Fetch student list and attendance records for the selected date/standard/division
  const fetchData = async () => {
    if (!standard || !division || !date) {
      showAlert('Please select standard, division, and date', 'error');
      return;
    }
    setLoading(true);
    try {
      const formattedDate = formatDateToYMD(date);
      const lockedRes = await axios.get('http://localhost:5000/api/attendance/check-lock', {
        params: { standard, division, date: formattedDate },
      });
      const locked = lockedRes.data.locked;
      setIsLocked(locked);

      // Fetch all students for the selected standard/division
      const studentsRes = await axios.get('http://localhost:5000/api/users/students', {
        params: { standard, division },
      });
      const studentList = studentsRes.data.students || [];
      setStudents(studentList);

      // Fetch attendance records for the selected date
      const attRes = await axios.get('http://localhost:5000/api/attendance/day', {
        params: { date: formattedDate },
      });
      const attData = {};
      attRes.data.attendance.forEach(record => {
        attData[record.student_id] = record.status;
      });
      setAttendanceRecords(attData);

      // For marked students, default edit mode is false.
      const edits = {};
      studentList.forEach(student => {
        if (attData[student.id]) {
          edits[student.id] = false;
        }
      });
      setEditModes(edits);

      showAlert('Data fetched successfully');
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('Error fetching data', 'error');
    }
    setLoading(false);
  };

  // Handle change for a student's attendance (both new marking and editing)
  const handleAttendanceChange = (studentId, value) => {
    if (isLocked) return;
    setAttendanceRecords(prev => ({ ...prev, [studentId]: value }));
  };

  // Toggle edit mode for a student in the Marked tab
  const toggleEditMode = (studentId) => {
    setEditModes(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  // Save the edited attendance for a student (calls PUT endpoint)
  const saveEditedAttendance = async (studentId) => {
    const formattedDate = formatDateToYMD(date);
    try {
      await axios.put('http://localhost:5000/api/attendance/update', {
        student_id: studentId,
        attendance_date: formattedDate,
        status: attendanceRecords[studentId],
      });
      showAlert('Attendance updated successfully', 'success');
      // Toggle off edit mode
      toggleEditMode(studentId);
    } catch (error) {
      console.error('Error updating attendance:', error);
      showAlert('Error updating attendance', 'error');
    }
  };

  // Submit attendance (for all students) and lock records
  const handleSubmitAttendance = async () => {
    if (isLocked) {
      showAlert('Attendance is already locked', 'warning');
      return;
    }
    // Check for any remaining student with no attendance marked
    const remaining = students.filter(student => !attendanceRecords[student.id]);
    if (remaining.length > 0) {
      showAlert('Please mark attendance for all remaining students', 'error');
      return;
    }
    setLoading(true);
    try {
      const formattedDate = formatDateToYMD(date);
      const records = students.map(student => ({
        student_id: student.id,
        status: attendanceRecords[student.id],
      }));
      // Bulk mark attendance (for any records not yet inserted)
      await axios.post('http://localhost:5000/api/attendance/mark-bulk', {
        date: formattedDate,
        attendance: records,
      });
      // Lock the records
      await axios.post('http://localhost:5000/api/attendance/lock', {
        standard,
        division,
        date: formattedDate,
      });
      setIsLocked(true);
      showAlert('Attendance marked and locked successfully!', 'success');
    } catch (error) {
      console.error('Error submitting attendance:', error);
      showAlert('Error submitting attendance', 'error');
    }
    setLoading(false);
  };

  // Split students into two lists: remaining (no record) and marked (record exists)
  const remainingStudents = students.filter(student => !attendanceRecords[student.id]);
  const markedStudents = students.filter(student => attendanceRecords[student.id]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // On mount, load saved context from localStorage and auto-fetch if available
  useEffect(() => {
    const savedStandard = localStorage.getItem('attendanceStandard');
    const savedDivision = localStorage.getItem('attendanceDivision');
    const savedDate = localStorage.getItem('attendanceDate');
    if (savedStandard && savedDivision && savedDate) {
      setStandard(savedStandard);
      setDivision(savedDivision);
      setDate(new Date(savedDate));
      fetchData();
    }
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

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Take Attendance
        </Typography>

        {/* Selection Form */}
        <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Standard</InputLabel>
                <Select
                  value={standard}
                  label="Standard"
                  onChange={(e) => setStandard(e.target.value)}
                  disabled={isLocked}
                >
                  <MenuItem value="9">9</MenuItem>
                  <MenuItem value="10">10</MenuItem>
                  <MenuItem value="11">11</MenuItem>
                  <MenuItem value="12">12</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Division</InputLabel>
                <Select
                  value={division}
                  label="Division"
                  onChange={(e) => setDivision(e.target.value)}
                  disabled={isLocked}
                >
                  <MenuItem value="A">A</MenuItem>
                  <MenuItem value="B">B</MenuItem>
                  <MenuItem value="C">C</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                selected={date}
                onChange={(newDate) => setDate(newDate)}
                dateFormat="yyyy-MM-dd"
                customInput={<TextField label="Date" fullWidth size="small" />}
                disabled={isLocked}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                onClick={fetchData}
                startIcon={<SearchIcon />}
                sx={{ textTransform: 'none' }}
                disabled={isLocked || loading}
              >
                Fetch Students
              </Button>
            </Grid>
          </Grid>
        </Card>

        {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}

        {students.length > 0 && (
          <Card sx={{ borderRadius: 2, boxShadow: 3, overflowX: 'auto', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
              <Tab label={`Remaining (${remainingStudents.length})`} />
              <Tab label={`Marked (${markedStudents.length})`} />
            </Tabs>
            {tabValue === 0 && (
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Attendance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {remainingStudents.map(student => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        <RadioGroup
                          row
                          value={attendanceRecords[student.id] || ''}
                          onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                        >
                          <FormControlLabel value="present" control={<Radio />} label="Present" />
                          <FormControlLabel value="absent" control={<Radio />} label="Absent" />
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {tabValue === 1 && (
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Attendance</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {markedStudents.map(student => {
                    const currentStatus = attendanceRecords[student.id] || '';
                    const inEdit = editModes[student.id] || false;
                    return (
                      <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          {inEdit ? (
                            <RadioGroup
                              row
                              value={currentStatus}
                              onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                            >
                              <FormControlLabel value="present" control={<Radio />} label="Present" />
                              <FormControlLabel value="absent" control={<Radio />} label="Absent" />
                            </RadioGroup>
                          ) : (
                            <Chip
                              label={currentStatus}
                              color={currentStatus === 'present' ? 'success' : 'error'}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {!isLocked && (
                            inEdit ? (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => saveEditedAttendance(student.id)}
                                startIcon={<SaveIcon />}
                                sx={{ textTransform: 'none' }}
                              >
                                Save
                              </Button>
                            ) : (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => toggleEditMode(student.id)}
                                startIcon={<EditIcon />}
                                sx={{ textTransform: 'none' }}
                              >
                                Edit
                              </Button>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        )}

        {students.length > 0 && !isLocked && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitAttendance}
              disabled={isLocked || loading}
              startIcon={<UnlockIcon />}
              sx={{ textTransform: 'none' }}
            >
              Submit & Lock Attendance
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default TakeAttendance;
