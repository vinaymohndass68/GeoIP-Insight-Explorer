
export interface IpData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  latitude: number;
  longitude: number;
  asn: string;
  org: string;
  timezone: string;
  postal: string;
}

export interface LocationInsight {
  summary: string;
  funFact: string;
  topLandmark: string;
}

export interface MapMarker {
  lat: number;
  lng: number;
}
