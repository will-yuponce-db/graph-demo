import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { Send } from '@mui/icons-material';

const Forms: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    gender: '',
    interests: {
      technology: false,
      sports: false,
      music: false,
      travel: false,
    },
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      interests: { ...prev.interests, [name]: checked },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    console.log('Form submitted:', formData);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
        Form Examples
      </Typography>

      {submitted && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Form submitted successfully! Check the console for data.
        </Alert>
      )}

      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Text Fields */}
              <Typography variant="h6" color="primary">
                Personal Information
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </Box>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />

              {/* Select Dropdown */}
              <FormControl fullWidth>
                <InputLabel id="country-label">Country</InputLabel>
                <Select
                  labelId="country-label"
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                  required
                >
                  <MenuItem value="us">United States</MenuItem>
                  <MenuItem value="uk">United Kingdom</MenuItem>
                  <MenuItem value="ca">Canada</MenuItem>
                  <MenuItem value="au">Australia</MenuItem>
                  <MenuItem value="de">Germany</MenuItem>
                  <MenuItem value="jp">Japan</MenuItem>
                </Select>
              </FormControl>

              {/* Radio Buttons */}
              <FormControl component="fieldset">
                <FormLabel component="legend">Gender</FormLabel>
                <RadioGroup row name="gender" value={formData.gender} onChange={handleInputChange}>
                  <FormControlLabel value="male" control={<Radio />} label="Male" />
                  <FormControlLabel value="female" control={<Radio />} label="Female" />
                  <FormControlLabel value="other" control={<Radio />} label="Other" />
                  <FormControlLabel
                    value="prefer-not"
                    control={<Radio />}
                    label="Prefer not to say"
                  />
                </RadioGroup>
              </FormControl>

              {/* Checkboxes */}
              <FormControl component="fieldset">
                <FormLabel component="legend">Interests</FormLabel>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="technology"
                        checked={formData.interests.technology}
                        onChange={handleCheckboxChange}
                      />
                    }
                    label="Technology"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="sports"
                        checked={formData.interests.sports}
                        onChange={handleCheckboxChange}
                      />
                    }
                    label="Sports"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="music"
                        checked={formData.interests.music}
                        onChange={handleCheckboxChange}
                      />
                    }
                    label="Music"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="travel"
                        checked={formData.interests.travel}
                        onChange={handleCheckboxChange}
                      />
                    }
                    label="Travel"
                  />
                </FormGroup>
              </FormControl>

              {/* Multiline Text */}
              <TextField
                fullWidth
                label="Message"
                name="message"
                multiline
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Tell us something about yourself..."
              />

              {/* Submit Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button type="submit" variant="contained" size="large" endIcon={<Send />}>
                  Submit Form
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Forms;
