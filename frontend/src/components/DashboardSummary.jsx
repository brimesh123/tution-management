// src/components/DashboardSummary.jsx
import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  useTheme,
  LinearProgress
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import TodayIcon from '@mui/icons-material/Today';
import axios from 'axios';

// Custom theme colors
const customColors = {
  student: {
    light: '#E3F2FD',
    main: '#2196F3',
    dark: '#1976D2'
  },
  teacher: {
    light: '#E8F5E9',
    main: '#4CAF50',
    dark: '#388E3C'
  },
  attendance: {
    light: '#FFF3E0',
    main: '#FF9800',
    dark: '#F57C00'
  },
  absent: {
    light: '#FFEBEE',
    main: '#F44336',
    dark: '#D32F2F'
  }
};

const DashboardSummary = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    todayAttendance: 0,
    absentToday: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const [studentsRes, teachersRes, attendanceRes] = await Promise.all([
          axios.get('http://localhost:5000/api/users/students'),
          axios.get('http://localhost:5000/api/users/teachers'),
          axios.get(`http://localhost:5000/api/attendance/day?date=${today}`)
        ]);

        const attendance = attendanceRes.data.attendance || [];
        const absents = attendance.filter(record => record.status === 'absent').length;

        setStats({
          totalStudents: studentsRes.data.students.length,
          totalTeachers: teachersRes.data.teachers.length,
          todayAttendance: attendance.length,
          absentToday: absents
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const summaryItems = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      colors: customColors.student,
      percentage: 100
    },
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      icon: <PersonIcon sx={{ fontSize: 40 }} />,
      colors: customColors.teacher,
      percentage: 100
    },
    {
      title: 'Today Attendance',
      value: stats.todayAttendance,
      icon: <TodayIcon sx={{ fontSize: 40 }} />,
      colors: customColors.attendance,
      percentage: stats.totalStudents ? (stats.todayAttendance / stats.totalStudents) * 100 : 0
    },
    {
      title: 'Absent Today',
      value: stats.absentToday,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      colors: customColors.absent,
      percentage: stats.totalStudents ? (stats.absentToday / stats.totalStudents) * 100 : 0
    }
  ];

  return (
    <Box sx={{ mb: 4, p: 2 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600, color: theme.palette.text.primary }}>
        Dashboard Overview
      </Typography>
      <Grid container spacing={3}>
        {summaryItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${item.colors.light} 0%, white 100%)`,
                borderRadius: 2,
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px 0 rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box
                    sx={{
                      backgroundColor: item.colors.light,
                      borderRadius: '12px',
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {React.cloneElement(item.icon, { sx: { color: item.colors.main } })}
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      ml: 2,
                      color: theme.palette.text.primary,
                      fontWeight: 500
                    }}
                  >
                    {item.title}
                  </Typography>
                </Box>
                
                <Typography 
                  variant="h3" 
                  sx={{ 
                    mb: 1,
                    color: item.colors.dark,
                    fontWeight: 600
                  }}
                >
                  {loading ? '-' : item.value}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={loading ? 0 : item.percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: `${item.colors.light}`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: item.colors.main,
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mt: 0.5,
                      color: theme.palette.text.secondary,
                      textAlign: 'right'
                    }}
                  >
                    {loading ? '0%' : `${Math.round(item.percentage)}%`}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardSummary;