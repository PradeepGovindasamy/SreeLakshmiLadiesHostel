import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  AppBar,
  Toolbar,
  Paper
} from '@mui/material';
import { 
  Home as HomeIcon,
  Hotel as HotelIcon,
  LocalLaundryService,
  Wifi,
  Restaurant,
  Security,
  WaterDrop,
  ElectricBolt,
  Phone,
  Email,
  LocationOn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  const amenities = [
    { icon: <Wifi sx={{ fontSize: 40 }} />, title: 'Free Wi-Fi', description: 'High-speed internet access' },
    { icon: <Restaurant sx={{ fontSize: 40 }} />, title: 'Meals', description: 'Nutritious homely food' },
    { icon: <Security sx={{ fontSize: 40 }} />, title: '24/7 Security', description: 'Safe and secure environment' },
    { icon: <LocalLaundryService sx={{ fontSize: 40 }} />, title: 'Laundry', description: 'In-house laundry facility' },
    { icon: <WaterDrop sx={{ fontSize: 40 }} />, title: 'Water Supply', description: '24 hours water supply' },
    { icon: <ElectricBolt sx={{ fontSize: 40 }} />, title: 'Power Backup', description: 'Uninterrupted power supply' }
  ];

  const features = [
    'Fully furnished rooms',
    'Attached bathroom in each room',
    'Spacious common areas',
    'Study room facility',
    'Recreation room',
    'CCTV surveillance',
    'Visitor management',
    'Separate parking space'
  ];

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar position="static" sx={{ backgroundColor: '#2c3e50' }}>
        <Toolbar>
          <HotelIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sree Lakshmi Ladies Hostel
          </Typography>
          <Button color="inherit" href="#home">Home</Button>
          <Button color="inherit" href="#about">About</Button>
          <Button color="inherit" href="#amenities">Amenities</Button>
          <Button color="inherit" href="#contact">Contact</Button>
          <Button 
            variant="contained" 
            sx={{ ml: 2, backgroundColor: '#e74c3c' }}
            onClick={() => navigate('/login')}
          >
            Management Login
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        id="home"
        sx={{
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 15,
          textAlign: 'center'
        }}
      >
        <Container>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Welcome to Sree Lakshmi Ladies Hostel
          </Typography>
          <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
            Your Home Away From Home - A Safe and Comfortable Stay for Women
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            sx={{ 
              backgroundColor: 'white', 
              color: '#667eea',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': { backgroundColor: '#f0f0f0' }
            }}
            href="#contact"
          >
            Contact Us
          </Button>
        </Container>
      </Box>

      {/* About Section */}
      <Container id="about" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" gutterBottom textAlign="center" sx={{ mb: 6, fontWeight: 'bold' }}>
          About Us
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
              <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                Our Vision
              </Typography>
              <Typography variant="body1" paragraph>
                Sree Lakshmi Ladies Hostel is dedicated to providing a safe, comfortable, and homely 
                environment for working women and students. We understand the importance of a secure 
                living space that feels like home.
              </Typography>
              <Typography variant="body1">
                With years of experience in hostel management, we prioritize cleanliness, security, 
                and the well-being of our residents. Our hostel is strategically located with easy 
                access to educational institutions, IT parks, and shopping centers.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4, height: '100%', backgroundColor: '#f8f9fa' }}>
              <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                Why Choose Us?
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {features.map((feature, index) => (
                  <Typography component="li" variant="body1" key={index} sx={{ mb: 1 }}>
                    {feature}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Amenities Section */}
      <Box id="amenities" sx={{ backgroundColor: '#f8f9fa', py: 8 }}>
        <Container>
          <Typography variant="h3" component="h2" gutterBottom textAlign="center" sx={{ mb: 6, fontWeight: 'bold' }}>
            Our Amenities
          </Typography>
          <Grid container spacing={4}>
            {amenities.map((amenity, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  elevation={3} 
                  sx={{ 
                    height: '100%', 
                    textAlign: 'center', 
                    p: 3,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ color: '#667eea', mb: 2 }}>
                      {amenity.icon}
                    </Box>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {amenity.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {amenity.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Room Types Section */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" gutterBottom textAlign="center" sx={{ mb: 6, fontWeight: 'bold' }}>
          Room Options
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  Single Room
                </Typography>
                <Typography variant="body1" paragraph>
                  Private room with attached bathroom, perfect for those who value privacy.
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Features:
                </Typography>
                <Box component="ul">
                  <li>Single bed</li>
                  <li>Study table & chair</li>
                  <li>Wardrobe</li>
                  <li>Attached bathroom</li>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  Double Sharing
                </Typography>
                <Typography variant="body1" paragraph>
                  Comfortable room for two with all essential amenities.
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Features:
                </Typography>
                <Box component="ul">
                  <li>Two beds</li>
                  <li>Study tables</li>
                  <li>Individual wardrobes</li>
                  <li>Attached bathroom</li>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  Triple Sharing
                </Typography>
                <Typography variant="body1" paragraph>
                  Spacious room ideal for three occupants with quality furnishing.
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Features:
                </Typography>
                <Box component="ul">
                  <li>Three beds</li>
                  <li>Study area</li>
                  <li>Storage space</li>
                  <li>Attached bathroom</li>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Contact Section */}
      <Box id="contact" sx={{ backgroundColor: '#2c3e50', color: 'white', py: 8 }}>
        <Container>
          <Typography variant="h3" component="h2" gutterBottom textAlign="center" sx={{ mb: 6, fontWeight: 'bold' }}>
            Get In Touch
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Phone sx={{ fontSize: 50, color: '#667eea', mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Call Us
                  </Typography>
                  <Typography variant="body1">
                    +91 99628 20828
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available 24/7
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Email sx={{ fontSize: 50, color: '#667eea', mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Email Us
                  </Typography>
                  <Typography variant="body1">
                    sreelakshmiladieshostel91@gmail.com
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    We'll respond within 24 hours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <LocationOn sx={{ fontSize: 50, color: '#667eea', mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Visit Us
                  </Typography>
                  <Typography variant="body1">
                    Chennai, Tamil Nadu
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Easy access to IT corridor
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: '#1a252f', color: 'white', py: 4 }}>
        <Container>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Sree Lakshmi Ladies Hostel
              </Typography>
              <Typography variant="body2">
                A trusted name in ladies hostel accommodation. Providing safe, 
                comfortable, and affordable living spaces for women.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} textAlign={{ xs: 'left', md: 'right' }}>
              <Typography variant="body2">
                © 2026 Sree Lakshmi Ladies Hostel. All rights reserved.
              </Typography>
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                sx={{ mt: 2 }}
              >
                Management Access
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
