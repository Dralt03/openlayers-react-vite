import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';

const MapComponent = () => {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const [currentLayerName, setCurrentLayerName] = useState('');

  const wmsLayers = [
    { name: 'Land Use Land Cover 2005-06', url: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms', layer: 'lulc:BR_LULC50K_1112' },
    { name: 'Land Use Land Cover 2011-12', url: 'https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms', layer: 'lulc:BR_LULC50K_1112' },
    { name: 'Urban Land Use: NUIS 2006-07', url: 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/nuis/wms', layer: 'urban:nuis' }
  ];

  useEffect(() => {
    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    const map = new Map({
      target: mapElement.current,
      layers: [osmLayer],
      view: new View({
        center: fromLonLat([78.9629, 20.5937]),
        zoom: 5,
      }),
      controls: defaultControls(),
    });

    mapRef.current = map;

    return () => {
      map.setTarget(null);
    };
  }, []);

  useEffect(() => {
    const showSmoothTransitions = (wmsLayers, transitionDuration) => {
      let currentIndex = 0;
      let nextIndex = 1;
      let currentLayer = null;
      let nextLayer = null;

      const createWmsLayer = (layerDetails, opacity = 1) => {
        return new ImageLayer({
          source: new ImageWMS({
            url: layerDetails.url,
            params: {
              LAYERS: layerDetails.layer,
            },
            serverType: 'geoserver',
          }),
          opacity: opacity,
        });
      };

      const transition = () => {
        if (currentLayer) {
          mapRef.current.removeLayer(currentLayer);
        }

        currentLayer = nextLayer;
        nextIndex = (nextIndex + 1) % wmsLayers.length;
        nextLayer = createWmsLayer(wmsLayers[nextIndex], 0);
        mapRef.current.addLayer(nextLayer);

        setCurrentLayerName(wmsLayers[currentIndex].name);

        let start = null;
        const animate = (timestamp) => {
          if (!start) start = timestamp;
          const progress = (timestamp - start) / transitionDuration;

          if (progress < 1) {
            currentLayer.setOpacity(1 - progress);
            nextLayer.setOpacity(progress);
            requestAnimationFrame(animate);
          } else {
            currentIndex = (currentIndex + 1) % wmsLayers.length;
            setTimeout(transition, 100); // Wait for 2 seconds before next transition
          }
        };

        requestAnimationFrame(animate);
      };

      // Start the transition
      nextLayer = createWmsLayer(wmsLayers[currentIndex]);
      mapRef.current.addLayer(nextLayer);
      transition();
    };

    showSmoothTransitions(wmsLayers, 1000); // 1000ms (1 second) transition duration

    // No need for cleanup as the transitions will stop when the component unmounts
  }, []);

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>Smooth Transitioning WMS Layers</h1>
      <div
        ref={mapElement}
        style={{
          height: '80vh',
          width: '100vw',
          border: '2px solid #000',
        }}
      />
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <p>Currently displaying: {currentLayerName}</p>
      </div>
    </div>
  );
};

export default MapComponent;