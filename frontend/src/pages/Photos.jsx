// src/pages/Photos.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Button, Box, Grid, Card, CardMedia, CardContent } from '@mui/material';
import axios from 'axios';

function Photos() {
  console.log("Photos component rendered");
  const [selectedFile, setSelectedFile] = useState(null);
  const [photos, setPhotos] = useState([]);

  const handleFileChange = (e) => {
    console.log("File selected:", e.target.files[0]);
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }
    console.log("Uploading file:", selectedFile);
    const formData = new FormData();
    formData.append('photo', selectedFile);

    axios.post('http://localhost:5000/api/photos/upload', formData)
      .then(response => {
        console.log("Photo uploaded:", response.data);
        alert("Photo uploaded successfully!");
        fetchPhotos();
      })
      .catch(error => {
        console.error("Error uploading photo:", error);
        alert("Error uploading photo");
      });
  };

  const fetchPhotos = () => {
    console.log("Fetching photos");
    axios.get('http://localhost:5000/api/photos')
      .then(response => {
        console.log("Photos fetched:", response.data);
        setPhotos(response.data.photos);
      })
      .catch(error => {
        console.error("Error fetching photos:", error);
      });
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Photo Upload & Gallery</Typography>
      <Box sx={{ mb: 2 }}>
        <input type="file" onChange={handleFileChange} />
        <Button variant="contained" sx={{ ml: 2 }} onClick={handleUpload}>Upload Photo</Button>
      </Box>
      <Grid container spacing={2}>
        {photos.map(photo => (
          <Grid item xs={12} sm={6} md={4} key={photo.id}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={`http://localhost:5000${photo.file_url}`}
                alt="Uploaded Photo"
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Uploaded on: {new Date(photo.uploaded_at).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Photos;
