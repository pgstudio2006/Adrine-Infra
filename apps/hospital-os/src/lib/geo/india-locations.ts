export type LocationOption = { value: string; label: string };

export const INDIA_COUNTRIES: LocationOption[] = [
  { value: 'India', label: 'India' },
  { value: 'Nepal', label: 'Nepal' },
  { value: 'Other', label: 'Other' },
];

/** Indian states and union territories */
export const INDIA_STATES: LocationOption[] = [
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
  { value: 'Assam', label: 'Assam' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'Chhattisgarh', label: 'Chhattisgarh' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Goa', label: 'Goa' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
  { value: 'Jharkhand', label: 'Jharkhand' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Manipur', label: 'Manipur' },
  { value: 'Meghalaya', label: 'Meghalaya' },
  { value: 'Mizoram', label: 'Mizoram' },
  { value: 'Nagaland', label: 'Nagaland' },
  { value: 'Odisha', label: 'Odisha' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Sikkim', label: 'Sikkim' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Tripura', label: 'Tripura' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Uttarakhand', label: 'Uttarakhand' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Chandigarh', label: 'Chandigarh' },
  { value: 'Jammu and Kashmir', label: 'Jammu and Kashmir' },
  { value: 'Ladakh', label: 'Ladakh' },
  { value: 'Puducherry', label: 'Puducherry' },
];

export const INDIA_DISTRICTS: Record<string, LocationOption[]> = {
  Haryana: [
    { value: 'Gurugram', label: 'Gurugram' },
    { value: 'Pataudi', label: 'Pataudi' },
    { value: 'Faridabad', label: 'Faridabad' },
    { value: 'Rewari', label: 'Rewari' },
    { value: 'Rohtak', label: 'Rohtak' },
    { value: 'Hisar', label: 'Hisar' },
    { value: 'Karnal', label: 'Karnal' },
    { value: 'Panipat', label: 'Panipat' },
    { value: 'Ambala', label: 'Ambala' },
    { value: 'Sonipat', label: 'Sonipat' },
  ],
  Delhi: [
    { value: 'New Delhi', label: 'New Delhi' },
    { value: 'South Delhi', label: 'South Delhi' },
    { value: 'North Delhi', label: 'North Delhi' },
    { value: 'East Delhi', label: 'East Delhi' },
    { value: 'West Delhi', label: 'West Delhi' },
  ],
  Maharashtra: [
    { value: 'Mumbai', label: 'Mumbai' },
    { value: 'Pune', label: 'Pune' },
    { value: 'Nagpur', label: 'Nagpur' },
    { value: 'Thane', label: 'Thane' },
    { value: 'Nashik', label: 'Nashik' },
  ],
  Gujarat: [
    { value: 'Ahmedabad', label: 'Ahmedabad' },
    { value: 'Surat', label: 'Surat' },
    { value: 'Vadodara', label: 'Vadodara' },
    { value: 'Rajkot', label: 'Rajkot' },
  ],
  Rajasthan: [
    { value: 'Jaipur', label: 'Jaipur' },
    { value: 'Jodhpur', label: 'Jodhpur' },
    { value: 'Udaipur', label: 'Udaipur' },
    { value: 'Kota', label: 'Kota' },
  ],
  Punjab: [
    { value: 'Chandigarh', label: 'Chandigarh' },
    { value: 'Ludhiana', label: 'Ludhiana' },
    { value: 'Amritsar', label: 'Amritsar' },
    { value: 'Jalandhar', label: 'Jalandhar' },
  ],
  'Uttar Pradesh': [
    { value: 'Noida', label: 'Noida' },
    { value: 'Ghaziabad', label: 'Ghaziabad' },
    { value: 'Lucknow', label: 'Lucknow' },
    { value: 'Kanpur', label: 'Kanpur' },
    { value: 'Agra', label: 'Agra' },
  ],
  Karnataka: [
    { value: 'Bengaluru', label: 'Bengaluru' },
    { value: 'Mysuru', label: 'Mysuru' },
    { value: 'Mangaluru', label: 'Mangaluru' },
  ],
  'Tamil Nadu': [
    { value: 'Chennai', label: 'Chennai' },
    { value: 'Coimbatore', label: 'Coimbatore' },
    { value: 'Madurai', label: 'Madurai' },
  ],
  Telangana: [
    { value: 'Hyderabad', label: 'Hyderabad' },
    { value: 'Warangal', label: 'Warangal' },
  ],
  'West Bengal': [
    { value: 'Kolkata', label: 'Kolkata' },
    { value: 'Howrah', label: 'Howrah' },
  ],
  'Madhya Pradesh': [
    { value: 'Bhopal', label: 'Bhopal' },
    { value: 'Indore', label: 'Indore' },
  ],
  Kerala: [
    { value: 'Thiruvananthapuram', label: 'Thiruvananthapuram' },
    { value: 'Kochi', label: 'Kochi' },
  ],
  Bagmati: [{ value: 'Kathmandu', label: 'Kathmandu' }],
  Other: [{ value: 'Other', label: 'Other' }],
};

export const STATES_BY_COUNTRY: Record<string, LocationOption[]> = {
  India: INDIA_STATES,
  Nepal: [{ value: 'Bagmati', label: 'Bagmati' }],
  Other: [{ value: 'Other', label: 'Other' }],
};

export function statesForCountry(country: string): LocationOption[] {
  return STATES_BY_COUNTRY[country] ?? INDIA_STATES;
}

export function districtsForState(state: string): LocationOption[] {
  return INDIA_DISTRICTS[state] ?? [];
}
