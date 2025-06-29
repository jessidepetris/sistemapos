import { useEffect, useRef } from "react";

export interface Marker {
  position: google.maps.LatLngLiteral;
  title?: string;
}

export interface GoogleMapProps {
  center: google.maps.LatLngLiteral;
  zoom?: number;
  markers?: Marker[];
  style?: React.CSSProperties;
}

export function GoogleMap({ center, zoom = 13, markers = [], style }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    let isMounted = true;
    function init() {
      if (!isMounted || !mapRef.current) return;
      if (!mapInstance.current) {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom,
        });
      } else {
        mapInstance.current.setCenter(center);
        mapInstance.current.setZoom(zoom);
      }

      // Clear existing markers by recreating map or keep track? We'll just add new markers each effect.
      markers.forEach((m) => {
        new window.google.maps.Marker({
          position: m.position,
          title: m.title,
          map: mapInstance.current!,
        });
      });
    }

    if (!(window as any).google) {
      const script = document.createElement("script");
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    } else {
      init();
    }

    return () => {
      isMounted = false;
    };
  }, [center, zoom, markers]);

  return <div ref={mapRef} style={{ width: "100%", height: "300px", ...style }} />;
}
