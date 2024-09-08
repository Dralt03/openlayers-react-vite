import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';

const MapComponent = () => {
  const mapElement = useRef(null); // Ref for map DOM element
  const mapRef = useRef(null); // Ref for map instance
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0); // State to hold the current WMS layer index

  // List of WMS layers
  const wmsLayers = [
    { name: 'Land Use Land Cover 2005-06', url: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms', layer: 'lulc:BR_LULC50K_1112' },
    { name: 'Land Use Land Cover 2011-12', url: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms', layer: 'lulc:BR_LULC50K_1112' },
    { name: 'Urban Land Use: NUIS 2006-07', url: 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/nuis/wms', layer: 'urban:nuis' }
  ];

  useEffect(() => {
    // Create base map using OpenStreetMap layer
    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    // Initialize map
    const map = new Map({
      target: mapElement.current, // Target the div element with ref
      layers: [osmLayer], // Start with base layer
      view: new View({
        center: fromLonLat([78.9629, 20.5937]), // Center on India
        zoom: 5, // Adjust the zoom level as needed
      }),
      controls: defaultControls(), // Enable default map controls
    });

    // Store the map instance in a ref for further interactions
    mapRef.current = map;

    return () => {
      // Clean up when component unmounts
      map.setTarget(null);
    };
  }, []);

  useEffect(() => {
    // Function to add WMS layer to the map
    const addWmsLayer = (layerDetails) => {
      // Remove existing WMS layer if any
      mapRef.current.getLayers().forEach(layer => {
        if (layer instanceof ImageLayer) {
          mapRef.current.removeLayer(layer);
        }
      });

      // Add new WMS layer
      const newWmsLayer = new ImageLayer({
        source: new ImageWMS({
          url: layerDetails.url,
          params: {
            LAYERS: layerDetails.layer,
          },
          serverType: 'geoserver',
        }),
      });

      mapRef.current.addLayer(newWmsLayer);
    };

    // Add the current WMS layer when the component mounts or layer index changes
    addWmsLayer(wmsLayers[currentLayerIndex]);

    // Automatically cycle through WMS layers every 2 seconds
    const intervalId = setInterval(() => {
      setCurrentLayerIndex((prevIndex) => (prevIndex + 1) % wmsLayers.length);
    }, 300);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [currentLayerIndex]);

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>Auto-Switching WMS Layers</h1>
      <div
        ref={mapElement}
        style={{
          height: '80vh', // Set height of map container
          width: '100vw', // Full width
          border: '2px solid #000',
        }}
      />
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <p>Currently displaying: {wmsLayers[currentLayerIndex].name}</p>
      </div>
    </div>
  );
};

export default MapComponent;
