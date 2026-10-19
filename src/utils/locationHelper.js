import { Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * Helper to obtain user's current GPS location and optionally reverse-geocode
 * into a human-readable Indian street address, city, state, and pincode.
 */
export async function getCurrentUserLocation() {
  try {
    // 1. Web environment support
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const coords = {
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              accuracy: Math.round(pos.coords.accuracy || 10),
            };

            let address = null;
            try {
              const resp = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
              );
              if (resp.ok) {
                const data = await resp.json();
                const a = data.address || {};
                const streetParts = [
                  a.house_number,
                  a.building,
                  a.road,
                  a.suburb,
                  a.neighbourhood,
                ].filter(Boolean);

                address = {
                  street: streetParts.join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || '',
                  city: a.city || a.town || a.village || a.municipality || 'Kolkata',
                  state: a.state || 'West Bengal',
                  postalCode: a.postcode ? a.postcode.replace(/\D/g, '').slice(0, 6) : '',
                  country: a.country || 'India',
                  formattedAddress: data.display_name || '',
                };
              }
            } catch (err) {
              // Reverse geocoding non-fatal
            }

            resolve({ success: true, coords, address });
          },
          (err) => {
            let msg = 'Could not retrieve location.';
            if (err.code === 1) msg = 'Location permission was denied. Please allow location in your browser.';
            else if (err.code === 2) msg = 'GPS position is currently unavailable.';
            else if (err.code === 3) msg = 'Location request timed out.';
            resolve({ success: false, error: msg });
          },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
        );
      });
    }

    // 2. Mobile (Android & iOS) via expo-location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Location permission was denied. Please enable location access in settings to detect your current site.',
      };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const coords = {
      latitude: Number(loc.coords.latitude.toFixed(6)),
      longitude: Number(loc.coords.longitude.toFixed(6)),
      accuracy: Math.round(loc.coords.accuracy || 10),
    };

    let address = null;
    try {
      const geocoded = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (Array.isArray(geocoded) && geocoded.length > 0) {
        const item = geocoded[0];
        const streetParts = [
          item.streetNumber,
          item.street,
          item.name,
          item.district,
        ].filter(Boolean);

        address = {
          street: streetParts.join(', ') || item.formattedAddress || '',
          city: item.city || item.subregion || item.district || 'Kolkata',
          state: item.region || 'West Bengal',
          postalCode: item.postalCode ? item.postalCode.replace(/\D/g, '').slice(0, 6) : '',
          country: item.country || 'India',
          formattedAddress: item.formattedAddress || '',
        };
      }
    } catch (revErr) {
      // Non-fatal
    }

    return { success: true, coords, address };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Unable to retrieve your current location. Please enter manually.',
    };
  }
}
