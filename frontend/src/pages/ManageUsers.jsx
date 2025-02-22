// src/pages/ManageUsers.jsx
import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  IconButton, 
  Paper, 
  Modal,
  Card,
  Chip,
  Tooltip,
  TableContainer,
  Alert,
  Fade,
  useTheme,
  alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axios from 'axios';

function ManageUsers() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filterStandard, setFilterStandard] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchStudents = () => {
    axios
      .get(`http://localhost:5000/api/users/students?standard=${filterStandard}&division=${filterDivision}`)
      .then((response) => {
        setStudents(response.data.students);
        showAlert('Students data refreshed successfully');
      })
      .catch((error) => {
        console.error(error);
        showAlert('Failed to fetch students', 'error');
      });
  };

  const fetchTeachers = () => {
    axios
      .get(`http://localhost:5000/api/users/teachers`)
      .then((response) => {
        setTeachers(response.data.teachers);
        showAlert('Teachers data refreshed successfully');
      })
      .catch((error) => {
        console.error(error);
        showAlert('Failed to fetch teachers', 'error');
      });
  };

  useEffect(() => {
    if (tabValue === 0) fetchStudents();
    else fetchTeachers();
  }, [tabValue, filterStandard, filterDivision]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      axios
        .delete(`http://localhost:5000/api/users/${id}`)
        .then(() => {
          tabValue === 0 ? fetchStudents() : fetchTeachers();
          showAlert('User deleted successfully');
        })
        .catch((error) => {
          console.error(error);
          showAlert('Failed to delete user', 'error');
        });
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setEditUser(null);
  };

  const handleUpdate = () => {
    axios
      .put(`http://localhost:5000/api/users/${editUser.id}`, editUser)
      .then(() => {
        handleModalClose();
        tabValue === 0 ? fetchStudents() : fetchTeachers();
        showAlert('User updated successfully');
      })
      .catch((error) => {
        console.error(error);
        showAlert('Failed to update user', 'error');
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
            Manage Users
          </Typography>
          <Chip 
            icon={tabValue === 0 ? <SchoolIcon /> : <PersonIcon />}
            label={tabValue === 0 ? 'Students' : 'Teachers'}
            color="primary"
            variant="outlined"
          />
        </Box>

        <Card sx={{ 
          mb: 3, 
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              px: 2,
              pt: 2,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 48,
                fontWeight: 500
              }
            }}
          >
            <Tab 
              icon={<SchoolIcon sx={{ mr: 1 }} />}
              label="Students" 
              iconPosition="start"
            />
            <Tab 
              icon={<PersonIcon sx={{ mr: 1 }} />}
              label="Teachers" 
              iconPosition="start"
            />
          </Tabs>

          {tabValue === 0 && (
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Standard"
                value={filterStandard}
                onChange={(e) => setFilterStandard(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
              />
              <TextField
                label="Division"
                value={filterDivision}
                onChange={(e) => setFilterDivision(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
              />
              <Button 
                variant="contained" 
                onClick={fetchStudents}
                startIcon={<SearchIcon />}
                sx={{ 
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Filter
              </Button>
            </Box>
          )}
        </Card>

        <Card sx={{ 
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Custom ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  {tabValue === 0 && <TableCell sx={{ fontWeight: 600 }}>Standard</TableCell>}
                  {tabValue === 0 && <TableCell sx={{ fontWeight: 600 }}>Division</TableCell>}
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(tabValue === 0 ? students : teachers).map((user) => (
                  <TableRow 
                    key={user.id}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: alpha(theme.palette.primary.main, 0.04) 
                      }
                    }}
                  >
                    <TableCell>{user.id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.custom_id}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    {tabValue === 0 && <TableCell>{user.standard}</TableCell>}
                    {tabValue === 0 && <TableCell>{user.division}</TableCell>}
                    <TableCell>
                      <Tooltip title="Edit user">
                        <IconButton 
                          onClick={() => handleEdit(user)}
                          size="small"
                          sx={{ 
                            color: theme.palette.primary.main,
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete user">
                        <IconButton 
                          onClick={() => handleDelete(user.id)}
                          size="small"
                          sx={{ 
                            color: theme.palette.error.main,
                            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      <Modal 
        open={openModal} 
        onClose={handleModalClose}
        closeAfterTransition
      >
        <Fade in={openModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}>
            {editUser && (
              <>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Edit User
                  </Typography>
                  <IconButton 
                    onClick={handleModalClose}
                    size="small"
                    sx={{ color: 'text.secondary' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                <TextField
                  label="Name"
                  fullWidth
                  margin="normal"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Email"
                  fullWidth
                  margin="normal"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  sx={{ mb: 3 }}
                />
                <Button 
                  variant="contained" 
                  onClick={handleUpdate}
                  fullWidth
                  sx={{ 
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Update User
                </Button>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}

export default ManageUsers;