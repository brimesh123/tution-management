import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Divider,
  Paper,
  Alert,
  Fade,
  useTheme,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Modal,
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Photo as PhotoIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  Collections as CollectionsIcon
} from '@mui/icons-material';
import axios from 'axios';

function PhotosManagement() {
  const theme = useTheme();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState(0);
  const [categories, setCategories] = useState([]);
  const [years, setYears] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    year: '',
    limit: 20,
    offset: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1
  });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoDetailsOpen, setPhotoDetailsOpen] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [photoDetails, setPhotoDetails] = useState({
    category: '',
    year: new Date().getFullYear(),
    description: '',
    related_to: ''
  });
  
  const role = localStorage.getItem('role');
  const canEdit = role === 'admin' || role === 'teacher';
  const token = localStorage.getItem('token');

  // Show alert message
  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };
  
  // Available categories
  const categoryOptions = [
    'results',
    'events',
    'celebrations',
    'sports',
    'classroom',
    'certificates',
    'general'
  ];
  
  // Years for filter (current year - 5 to current year)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  
  // Fetch photos with filters
  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.year) queryParams.append('year', filters.year);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.offset) queryParams.append('offset', filters.offset);
      
      const response = await axios.get(
        `http://localhost:5000/api/photos?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPhotos(response.data.photos || []);
      setCategories(response.data.filters?.categories || []);
      setYears(response.data.filters?.years || []);
      
      const total = response.data.pagination?.total || 0;
      const totalPages = Math.ceil(total / filters.limit);
      
      setPagination({
        total,
        page: Math.floor(filters.offset / filters.limit) + 1,
        totalPages
      });
    } catch (error) {
      console.error('Error fetching photos:', error);
      showAlert('Error fetching photos', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file change for upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      showAlert('Please select an image file', 'error');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('File size should be less than 5MB', 'error');
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      showAlert('Please select a file to upload', 'error');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('category', photoDetails.category || 'general');
      formData.append('year', photoDetails.year || new Date().getFullYear());
      formData.append('description', photoDetails.description || '');
      formData.append('related_to', photoDetails.related_to || '');
      
      await axios.post(
        'http://localhost:5000/api/photos/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,  // <-- Include token
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      showAlert('Photo uploaded successfully');
      setUploadDialog(false);
      resetUploadForm();
      fetchPhotos();
    } catch (error) {
      console.error('Error uploading photo:', error);
      showAlert('Error uploading photo', 'error');
    }
  };
  
  
  // Reset upload form
  const resetUploadForm = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setPhotoDetails({
      category: '',
      year: new Date().getFullYear(),
      description: '',
      related_to: ''
    });
  };
  
  // Delete photo
  const handleDeletePhoto = async (id) => {
    if (!canEdit) {
      showAlert('You do not have permission to delete photos', 'error');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }
    
    try {
      await axios.delete(
        `http://localhost:5000/api/photos/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }  // <-- Include token
        }
      );
      showAlert('Photo deleted successfully');
      fetchPhotos();
      
      if (photoDetailsOpen && selectedPhoto?.id === id) {
        setPhotoDetailsOpen(false);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      showAlert('Error deleting photo', 'error');
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Update filter based on tab
    const newFilters = { ...filters, offset: 0 };
    
    if (newValue === 0) {
      // All photos
      newFilters.category = '';
    } else if (newValue === 1) {
      // Results tab
      newFilters.category = 'results';
    } else if (newValue === 2) {
      // Events tab
      newFilters.category = 'events';
    }
    
    setFilters(newFilters);
  };
  
  // Apply filters
  const handleApplyFilters = () => {
    setFilters({ ...filters, offset: 0 });
    setPagination({ ...pagination, page: 1 });
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      category: activeTab === 0 ? '' : 
               activeTab === 1 ? 'results' : 
               activeTab === 2 ? 'events' : '',
      year: '',
      limit: 20,
      offset: 0
    });
  };
  
  // Handle page change
  const handlePageChange = (event, value) => {
    const newOffset = (value - 1) * filters.limit;
    setFilters({ ...filters, offset: newOffset });
    setPagination({ ...pagination, page: value });
  };
  
  // Open photo details dialog
  const handleViewPhoto = (photo) => {
    setSelectedPhoto(photo);
    setPhotoDetailsOpen(true);
  };
  
  // Open edit details dialog
  const handleEditDetails = () => {
    if (!selectedPhoto) return;
    
    setPhotoDetails({
      category: selectedPhoto.category || '',
      year: selectedPhoto.year || new Date().getFullYear(),
      description: selectedPhoto.description || '',
      related_to: selectedPhoto.related_to || ''
    });
    
    setEditDetailsOpen(true);
  };
  
  // Save edited details
    // Save edited details
    const handleSaveDetails = async () => {
      if (!selectedPhoto) return;
      try {
        await axios.put(
          `http://localhost:5000/api/photos/${selectedPhoto.id}`,
          photoDetails,
          {
            headers: { Authorization: `Bearer ${token}` }  // <-- Include token
          }
        );
        showAlert('Photo details updated successfully');
        setEditDetailsOpen(false);
        
        const updatedPhoto = { ...selectedPhoto, ...photoDetails };
        setSelectedPhoto(updatedPhoto);
        
        const updatedPhotos = photos.map(p => p.id === selectedPhoto.id ? updatedPhoto : p);
        setPhotos(updatedPhotos);
      } catch (error) {
        console.error('Error updating photo details:', error);
        showAlert('Error updating photo details', 'error');
      }
    };
    
  // Initial data fetch
  useEffect(() => {
    fetchPhotos();
  }, [filters.category, filters.year, filters.offset]);
  
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
              Photo Gallery
            </Typography>
            <Chip 
              icon={<CollectionsIcon />}
              label="Browse & Upload Photos"
              color="primary"
              variant="outlined"
            />
          </Box>
          
          {canEdit && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setUploadDialog(true)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Upload Photo
            </Button>
          )}
        </Box>
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="All Photos" />
            <Tab label="Results & Certificates" />
            <Tab label="Events & Activities" />
          </Tabs>
        </Box>
        
        {/* Filters */}
        <Card sx={{ mb: 3, p: 2, borderRadius: 2, boxShadow: theme.shadows[2] }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categoryOptions.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={filters.year}
                label="Year"
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              >
                <MenuItem value="">All Years</MenuItem>
                {yearOptions.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleApplyFilters}
                startIcon={<FilterIcon />}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleResetFilters}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Reset
              </Button>
            </Box>
          </Box>
        </Card>
        
        {/* Photo Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : photos.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2, boxShadow: theme.shadows[2] }}>
            <ImageIcon sx={{ fontSize: 60, color: theme.palette.grey[400], mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No photos found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {activeTab === 0 
                ? "There are no photos in the gallery yet." 
                : activeTab === 1 
                  ? "No result photos found. Upload some result certificates."
                  : "No event photos found. Upload some event photos."}
            </Typography>
            {canEdit && (
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialog(true)}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Upload Photos
              </Button>
            )}
          </Card>
        ) : (
          <>
            <ImageList 
              cols={3} 
              gap={16}
              sx={{ 
                mb: 3,
                [theme.breakpoints.down('md')]: {
                  cols: 2
                },
                [theme.breakpoints.down('sm')]: {
                  cols: 1
                }
              }}
            >
              {photos.map((photo) => (
                <ImageListItem 
                  key={photo.id} 
                  sx={{ 
                    overflow: 'hidden', 
                    borderRadius: 2,
                    boxShadow: theme.shadows[2],
                    cursor: 'pointer',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                  onClick={() => handleViewPhoto(photo)}
                >
                  <img
                    src={`http://localhost:5000${photo.file_url}`}
                    alt={photo.description || 'Photo'}
                    loading="lazy"
                    style={{ height: 200, objectFit: 'cover' }}
                  />
                  <ImageListItemBar
                    title={photo.description || (photo.category ? `${photo.category.charAt(0).toUpperCase() + photo.category.slice(1)} Photo` : 'Photo')}
                    subtitle={new Date(photo.uploaded_at).toLocaleDateString()}
                    actionIcon={
                      canEdit && (
                        <IconButton
                          sx={{ color: 'white' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo.id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )
                    }
                  />
                </ImageListItem>
              ))}
            </ImageList>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 4 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Box>
      
      {/* Upload Dialog */}
      <Dialog
        open={uploadDialog}
        onClose={() => setUploadDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Upload New Photo</Typography>
            <IconButton onClick={() => setUploadDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Upload Section */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  border: `2px dashed ${theme.palette.primary.main}`,
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {previewUrl ? (
                  <Box sx={{ position: 'relative', width: '100%', height: 200 }}>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.7)'
                        }
                      }}
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl('');
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <UploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Drag & Drop or Click to Upload
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Supported formats: JPG, PNG, GIF (Max size: 5MB)
                    </Typography>
                    <Button
                      variant="contained"
                      component="label"
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      Choose File
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
            
            {/* Details Section */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Photo Details
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={photoDetails.category}
                  label="Category *"
                  onChange={(e) => setPhotoDetails({ ...photoDetails, category: e.target.value })}
                  required
                >
                  {categoryOptions.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Year *</InputLabel>
                <Select
                  value={photoDetails.year}
                  label="Year *"
                  onChange={(e) => setPhotoDetails({ ...photoDetails, year: e.target.value })}
                  required
                >
                  {yearOptions.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Description"
                multiline
                rows={3}
                fullWidth
                value={photoDetails.description}
                onChange={(e) => setPhotoDetails({ ...photoDetails, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Related To (e.g., event name, student name)"
                fullWidth
                value={photoDetails.related_to}
                onChange={(e) => setPhotoDetails({ ...photoDetails, related_to: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setUploadDialog(false);
              resetUploadForm();
            }}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpload}
            disabled={!selectedFile}
            startIcon={<UploadIcon />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Upload Photo
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Photo Details Modal */}
      <Modal
        open={photoDetailsOpen}
        onClose={() => setPhotoDetailsOpen(false)}
        aria-labelledby="photo-details-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '80%', md: '70%' },
          maxWidth: 800,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          overflow: 'auto'
        }}>
          {selectedPhoto && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  {selectedPhoto.description || 
                   (selectedPhoto.category 
                    ? `${selectedPhoto.category.charAt(0).toUpperCase() + selectedPhoto.category.slice(1)} Photo` 
                    : 'Photo')}
                </Typography>
                <IconButton onClick={() => setPhotoDetailsOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <img
                  src={`http://localhost:5000${selectedPhoto.file_url}`}
                  alt={selectedPhoto.description || 'Photo'}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '60vh',
                    objectFit: 'contain',
                    borderRadius: 8
                  }}
                />
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {selectedPhoto.category && (
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Category
                    </Typography>
                    <Chip 
                      label={selectedPhoto.category} 
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                )}
                
                {selectedPhoto.year && (
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Year
                    </Typography>
                    <Typography variant="body1">
                      {selectedPhoto.year}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    Uploaded On
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedPhoto.uploaded_at).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                {selectedPhoto.related_to && (
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Related To
                    </Typography>
                    <Typography variant="body1">
                      {selectedPhoto.related_to}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              
              {selectedPhoto.description && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {selectedPhoto.description}
                  </Typography>
                </Box>
              )}
              
              {canEdit && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={handleEditDetails}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    Edit Details
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeletePhoto(selectedPhoto.id)}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    Delete
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Modal>
      
      {/* Edit Details Dialog */}
      <Dialog
        open={editDetailsOpen}
        onClose={() => setEditDetailsOpen(false)}
      >
        <DialogTitle>Edit Photo Details</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={photoDetails.category}
              label="Category"
              onChange={(e) => setPhotoDetails({ ...photoDetails, category: e.target.value })}
            >
              {categoryOptions.map(cat => (
                <MenuItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={photoDetails.year}
              label="Year"
              onChange={(e) => setPhotoDetails({ ...photoDetails, year: e.target.value })}
            >
              {yearOptions.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Description"
            multiline
            rows={3}
            fullWidth
            value={photoDetails.description}
            onChange={(e) => setPhotoDetails({ ...photoDetails, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            label="Related To"
            fullWidth
            value={photoDetails.related_to}
            onChange={(e) => setPhotoDetails({ ...photoDetails, related_to: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditDetailsOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveDetails}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default PhotosManagement;