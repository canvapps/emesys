
export interface GeocodingResult {
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

export const reverseGeocode = async (lat: number, lng: number): Promise<GeocodingResult | null> => {
  try {
    // Add delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Menggunakan Nominatim API untuk reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=id`,
      {
        headers: {
          'User-Agent': 'Wedding-App/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    
    if (!data || !data.address) {
      return null;
    }
    
    const address = data.address;
    
    // Extract address components
    const name = data.display_name?.split(',')[0] || 'Lokasi Terpilih';
    const fullAddress = data.display_name || `Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Try to extract city and province from address components
    const city = address.city || address.town || address.village || address.suburb || address.county || 'Jakarta';
    const province = address.state || address.province || address.region || 'DKI Jakarta';
    const postalCode = address.postcode || '';
    
    return {
      name: name.trim(),
      address: fullAddress,
      city: city,
      province: province,
      postalCode: postalCode
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};
