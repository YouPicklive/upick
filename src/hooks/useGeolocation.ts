 import { useState, useEffect, useCallback } from 'react';
 
 export interface Coordinates {
   latitude: number;
   longitude: number;
 }
 
 export interface GeolocationState {
   coordinates: Coordinates | null;
   error: string | null;
   isLoading: boolean;
   isPermissionDenied: boolean;
 }
 
 interface UseGeolocationReturn extends GeolocationState {
   requestLocation: () => void;
   calculateDistance: (lat: number, lng: number) => number | null;
   formatDistance: (lat: number, lng: number) => string;
 }
 
 // Haversine formula to calculate distance between two points
 function haversineDistance(
   lat1: number,
   lon1: number,
   lat2: number,
   lon2: number
 ): number {
   const R = 3958.8; // Earth's radius in miles
   const dLat = toRadians(lat2 - lat1);
   const dLon = toRadians(lon2 - lon1);
   const a =
     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
     Math.cos(toRadians(lat1)) *
       Math.cos(toRadians(lat2)) *
       Math.sin(dLon / 2) *
       Math.sin(dLon / 2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   return R * c;
 }
 
 function toRadians(degrees: number): number {
   return degrees * (Math.PI / 180);
 }
 
 export function useGeolocation(): UseGeolocationReturn {
   const [state, setState] = useState<GeolocationState>({
     coordinates: null,
     error: null,
     isLoading: false,
     isPermissionDenied: false,
   });
 
   const requestLocation = useCallback(() => {
     if (!navigator.geolocation) {
       setState((prev) => ({
         ...prev,
         error: 'Geolocation is not supported by your browser',
         isLoading: false,
       }));
       return;
     }
 
     setState((prev) => ({ ...prev, isLoading: true, error: null }));
 
     navigator.geolocation.getCurrentPosition(
       (position) => {
         setState({
           coordinates: {
             latitude: position.coords.latitude,
             longitude: position.coords.longitude,
           },
           error: null,
           isLoading: false,
           isPermissionDenied: false,
         });
       },
       (error) => {
         let errorMessage = 'Unable to get your location';
         let isPermissionDenied = false;
 
         switch (error.code) {
           case error.PERMISSION_DENIED:
             errorMessage = 'Location permission denied';
             isPermissionDenied = true;
             break;
           case error.POSITION_UNAVAILABLE:
             errorMessage = 'Location information unavailable';
             break;
           case error.TIMEOUT:
             errorMessage = 'Location request timed out';
             break;
         }
 
         setState({
           coordinates: null,
           error: errorMessage,
           isLoading: false,
           isPermissionDenied,
         });
       },
       {
         enableHighAccuracy: true,
         timeout: 10000,
         maximumAge: 300000, // Cache location for 5 minutes
       }
     );
   }, []);
 
   // Auto-request location on mount
   useEffect(() => {
     requestLocation();
   }, [requestLocation]);
 
   const calculateDistance = useCallback(
     (lat: number, lng: number): number | null => {
       if (!state.coordinates) return null;
       return haversineDistance(
         state.coordinates.latitude,
         state.coordinates.longitude,
         lat,
         lng
       );
     },
     [state.coordinates]
   );
 
   const formatDistance = useCallback(
     (lat: number, lng: number): string => {
       const distance = calculateDistance(lat, lng);
       if (distance === null) return '';
 
       if (distance < 0.1) {
         return 'Less than 0.1 mi';
       } else if (distance < 1) {
         return `${(distance * 5280).toFixed(0)} ft`;
       } else if (distance < 10) {
         return `${distance.toFixed(1)} mi`;
       } else {
         return `${Math.round(distance)} mi`;
       }
     },
     [calculateDistance]
   );
 
   return {
     ...state,
     requestLocation,
     calculateDistance,
     formatDistance,
   };
 }
 
 // Distance category based on preferences
 export function getDistanceCategory(miles: number): string {
   if (miles < 1) return 'walking';
   if (miles < 5) return 'short-drive';
   if (miles < 45) return 'road-trip';
   return 'epic-adventure';
 }
 
 // Format distance for display with emoji
 export function formatDistanceWithEmoji(miles: number | null): string {
   if (miles === null) return '📍 Nearby';
   
   if (miles < 0.1) {
     return '🚶 Steps away';
   } else if (miles < 1) {
     return `🚶 ${(miles * 5280).toFixed(0)} ft`;
   } else if (miles < 5) {
     return `🚗 ${miles.toFixed(1)} mi`;
   } else if (miles < 45) {
     return `🛣️ ${Math.round(miles)} mi`;
   } else {
     return `🌎 ${Math.round(miles)} mi`;
   }
 }