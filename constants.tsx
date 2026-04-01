
import React from 'react';
import { Appliance } from './types';

export const MAJOR_APPLIANCES: Appliance[] = [
  { id: 'ac', name: 'Air Conditioner', watts: 1500, icon: '❄️' },
  { id: 'fridge', name: 'Refrigerator', watts: 200, icon: '🧊' },
  { id: 'washing_machine', name: 'Washing Machine', watts: 500, icon: '🧺' },
  { id: 'geyser', name: 'Water Heater (Geyser)', watts: 2000, icon: '🚿' },
  { id: 'microwave', name: 'Microwave Oven', watts: 1000, icon: '🍲' },
  { id: 'tv', name: 'Television', watts: 100, icon: '📺' },
  { id: 'fan', name: 'Ceiling Fan', watts: 75, icon: '🌀' },
  { id: 'lights', name: 'LED Lights (10x)', watts: 90, icon: '💡' },
  { id: 'ev_charger', name: 'EV Charger', watts: 3000, icon: '⚡' },
];

export const HOUSE_TYPES = [
  'Independent Villa',
  'Apartment / Flat',
  'Commercial Building',
  'Small Studio'
];
