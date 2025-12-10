import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { LocationResult } from './types';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://34.101.188.206:3001';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedResult, setSelectedResult] = useState<LocationResult | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | undefined>(undefined);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (results.length > 0) {
      updateMapMarkers();
    }
  }, [results]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
    });

    try {
      await loader.load();
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 10,
      });
    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    results.forEach((result, index) => {
      const marker = new google.maps.Marker({
        position: { lat: result.latitude, lng: result.longitude },
        map: mapInstanceRef.current,
        title: result.name,
        label: (index + 1).toString(),
      });

      marker.addListener('click', () => {
        handleResultClick(result);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: result.latitude, lng: result.longitude });
    });

    if (results.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setSelectedResult(null);

    try {
      console.log('Searching for:', query);
      console.log('API URL:', `${API_BASE_URL}/api/search?query=${encodeURIComponent(query)}`);
      
      const response = await fetch(`${API_BASE_URL}/api/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      if (data.results.length === 0) {
        setError('No results found');
      } else {
        setResults(data.results);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: LocationResult) => {
    setSelectedResult(result);
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: result.latitude, lng: result.longitude });
      mapInstanceRef.current.setZoom(15);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="app">
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Enter an address or location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>

      <div className="content">
        <div className="results-container">
          {loading && <div className="loading">Searching...</div>}
          {error && <div className="error">{error}</div>}
          {!loading && !error && results.length === 0 && query && (
            <div className="no-results">No results found</div>
          )}
          {results.map((result) => (
            <div
              key={result.place_id}
              className={`result-item ${selectedResult?.place_id === result.place_id ? 'selected' : ''}`}
              onClick={() => handleResultClick(result)}
            >
              <div className="result-name">{result.name}</div>
              <div className="result-address">{result.formatted_address}</div>
              {result.postal_code && (
                <div className="result-postal">Zip/Postal Code: {result.postal_code}</div>
              )}
              <div className="result-coords">
                {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
              </div>
            </div>
          ))}
        </div>

        <div className="map-container">
          <div id="map" ref={mapRef}></div>
        </div>
      </div>
    </div>
  );
}

export default App;