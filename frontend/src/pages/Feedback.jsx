// src/pages/Feedback.jsx
import React, { useState, useEffect } from 'react';
import { Typography, TextField, Button, Box, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';

function Feedback() {
  console.log("Feedback component rendered");
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);
  const userId = 1; // Demo user ID

  const handleSubmitFeedback = () => {
    console.log("Submitting feedback:", feedbackText);
    axios.post('http://localhost:5000/api/feedback/add', { user_id: userId, feedback_text: feedbackText })
      .then(response => {
        console.log("Feedback submitted:", response.data);
        alert("Feedback submitted successfully!");
        setFeedbackText('');
        fetchFeedback();
      })
      .catch(error => {
        console.error("Error submitting feedback:", error);
        alert("Error submitting feedback");
      });
  };

  const fetchFeedback = () => {
    console.log("Fetching feedback records");
    axios.get('http://localhost:5000/api/feedback')
      .then(response => {
        console.log("Feedback records fetched:", response.data);
        setFeedbackList(response.data.feedback);
      })
      .catch(error => {
        console.error("Error fetching feedback:", error);
      });
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Feedback</Typography>
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Your Feedback"
          fullWidth
          multiline
          rows={4}
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        />
        <Button variant="contained" sx={{ mt: 2 }} onClick={handleSubmitFeedback}>
          Submit Feedback
        </Button>
      </Box>
      <Typography variant="h6" gutterBottom>All Feedback</Typography>
      <List>
        {feedbackList.map(feedback => (
          <ListItem key={feedback.id}>
            <ListItemText primary={feedback.feedback_text} secondary={`By User ID: ${feedback.user_id}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default Feedback;
