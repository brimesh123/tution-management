import React from 'react';
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText,
  ListItemIcon,
  ListItemButton,  // <-- Make sure this is imported

  Box, 
  Button,
  useTheme,
  useMediaQuery,
  IconButton,
  Avatar,
  Divider,
  Container
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Photo as PhotoIcon,
  Feedback as FeedbackIcon,
  Description as ReportIcon,
  AttachMoney as MoneyIcon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  FilterList as FilterIcon,
  Book as BookIcon,
  EventNote as EventIcon,
  School as SchoolIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';

import Attendance from './Attendance';
import TestManagement from './TestManagement';
import Results from './Results';
import Photos from './Photos';
import Feedback from './Feedback';
import MonthlyReport from './MonthlyReport';
import FeeStatus from './FeeStatus';
import AddStudent from './AddStudent';
import AddTeacher from './AddTeacher';
import ManageUsers from './ManageUsers';
import FilterStudents from './FilterStudents';
import SubjectManagement from './SubjectManagement';
import TakeAttendance from './TakeAttendance';
import DashboardSummary from '../components/DashboardSummary';
import ResultsManagement from './ResultsManagement';
import StudentResults from './StudentResults';
import FeeManagement from './FeeManagement';


const drawerWidth = 280;

function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const role = localStorage.getItem('role');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  // Base menu items for all roles
  const menuItems = [
    { text: 'Attendance', path: '/dashboard/attendance', icon: <DashboardIcon /> },
   
    
    { text: 'Photos', path: '/dashboard/photos', icon: <PhotoIcon /> },
    { text: 'Feedback', path: '/dashboard/feedback', icon: <FeedbackIcon /> },
    { text: 'Monthly Report', path: '/dashboard/monthly-report', icon: <ReportIcon /> },
    { text: 'Fee Status', path: '/dashboard/fee-status', icon: <MoneyIcon /> },
    { text: 'Student Results', path: '/dashboard/student-results', icon: <AssessmentIcon /> },
  ];

  // Admin-specific menu items
  if (role === 'admin') {
    menuItems.push(
      { text: 'Add Student', path: '/dashboard/add-student', icon: <PersonAddIcon /> },
      { text: 'Add Teacher', path: '/dashboard/add-teacher', icon: <PersonAddIcon /> },
      { text: 'Fee Management', path: '/dashboard/fee-management', icon: <MoneyIcon /> },
      { text: 'Test Management', path: '/dashboard/test-management', icon: <AssessmentIcon /> },
      { text: 'Manage Users', path: '/dashboard/manage-users', icon: <PeopleIcon /> },
      { text: 'Filter Students', path: '/dashboard/filter-students', icon: <FilterIcon /> },
      { text: 'Subject Management', path: '/dashboard/subject-management', icon: <BookIcon /> },
      { text: 'Take Attendance', path: '/dashboard/take-attendance', icon: <EventIcon /> },
      // { text: 'Results Management', path: '/dashboard/results/test', icon: <AssessmentIcon /> },
      
    
    );
  }

  const drawer = (
    <Box>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
          School Manager
        </Typography>
      </Box>
      <List sx={{ mt: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem 
              disablePadding
              key={item.text} 
              sx={{ mb: 0.5 }}
            >
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => isMobile && handleDrawerToggle()}
                sx={{
                  mx: 1,
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'primary.light' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.light' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive ? 'primary.main' : 'text.secondary',
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'primary.main' : 'text.primary'
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ mt: 2, mb: 2 }} />
      <Box sx={{ px: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ 
            borderRadius: '8px',
            py: 1
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: '#fff',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: 'text.primary'
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1,
              color: 'text.primary',
              fontWeight: 500
            }}
          >
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main',
                width: 35,
                height: 35
              }}
            >
              {role?.[0]?.toUpperCase()}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ 
          width: { md: drawerWidth }, 
          flexShrink: { md: 0 } 
        }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'background.paper',
              boxShadow: 'none'
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'background.paper',
              boxShadow: 'none',
              border: 'none',
              borderRight: '1px solid',
              borderColor: 'divider'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: '#f5f5f5'
        }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {/* Dashboard Summary Component */}
          <DashboardSummary />
          <Routes>
          <Route path="attendance" element={<Attendance />} />
  <Route path="test-management" element={<TestManagement />} />
  <Route path="results" element={<Results />} />
  <Route path="results/test/:testId" element={<ResultsManagement />} />
  <Route path="student-results" element={<StudentResults />} />
  <Route path="photos" element={<Photos />} />
  <Route path="feedback" element={<Feedback />} />
  <Route path="monthly-report" element={<MonthlyReport />} />
  <Route path="fee-status" element={<FeeStatus />} />
  {role === 'admin' && (
    <>
      <Route path="add-student" element={<AddStudent />} />
      <Route path="add-teacher" element={<AddTeacher />} />
      <Route path="fee-management" element={<FeeManagement />} />

      <Route path="manage-users" element={<ManageUsers />} />
      <Route path="filter-students" element={<FilterStudents />} />
      <Route path="subject-management" element={<SubjectManagement />} />
      <Route path="take-attendance" element={<TakeAttendance />} />
    </>
  )}
            <Route 
              path="*" 
              element={
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '50vh'
                }}>
                  <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
                    Welcome to School Manager
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Select a menu item to get started
                  </Typography>
                </Box>
              } 
            />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}

export default Dashboard;
