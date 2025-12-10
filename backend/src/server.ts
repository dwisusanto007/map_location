import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors({
  origin: ['http://localhost:3005', 'http://34.101.188.206:3002', 'http://34.101.188.206:3005'],
  credentials: true
}));
app.use(express.json());

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log('Searching for:', query);
    console.log('API Key exists:', !!process.env.GOOGLE_MAPS_API_KEY);

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/textsearch/json`,
      {
        params: {
          query,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    console.log('Google API response status:', response.data.status);
    console.log('Results count:', response.data.results?.length || 0);

    if (response.data.status !== 'OK') {
      console.error('Google API error:', response.data);
      return res.status(500).json({ error: `Google API error: ${response.data.status}` });
    }

    const results = await Promise.all(
      response.data.results.slice(0, 3).map(async (place: PlaceResult) => {
        let postal_code = '';
        
        try {
          const detailResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json`,
            {
              params: {
                place_id: place.place_id,
                fields: 'address_components',
                key: process.env.GOOGLE_MAPS_API_KEY,
              },
            }
          );
          
          if (detailResponse.data.status === 'OK' && detailResponse.data.result.address_components) {
            const postalComponent = detailResponse.data.result.address_components.find(
              (component: any) => component.types.includes('postal_code') || 
                                  component.types.includes('postal_code_prefix') ||
                                  component.types.includes('postal_code_suffix')
            );
            postal_code = postalComponent?.long_name || '';
          }
        } catch (error) {
          console.error('Error fetching place details:', error);
        }

        return {
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          postal_code,
        };
      })
    );

    res.json({ results });
  } catch (error) {
    console.error('Error searching places:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
    res.status(500).json({ error: 'Failed to search places' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});