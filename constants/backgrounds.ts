import { ViewStyle } from 'react-native';

export interface BackgroundDef {
  id: string;
  colors: string[];
  angle: number;
  locations?: number[];
}

export const BACKGROUNDS: BackgroundDef[] = [
  {
    id: 'bg_default',
    colors: ['#111827', '#111827'],
    angle: 180,
  },
  {
    id: 'bg_midnight',
    colors: ['#000008', '#05051f', '#0d0d3b', '#1a1040'],
    angle: 180,
    locations: [0, 0.3, 0.7, 1],
  },
  {
    id: 'bg_ocean',
    colors: ['#000d14', '#001a26', '#003845', '#005f73'],
    angle: 180,
    locations: [0, 0.35, 0.7, 1],
  },
  {
    id: 'bg_nebula',
    colors: ['#07000f', '#10002b', '#3c096c', '#5a189a'],
    angle: 175,
    locations: [0, 0.3, 0.65, 1],
  },
  {
    id: 'bg_ember',
    colors: ['#0a0000', '#1a0000', '#6a040f', '#9d0208'],
    angle: 180,
    locations: [0, 0.3, 0.7, 1],
  },
  {
    id: 'bg_aurora',
    colors: ['#001219', '#003d3b', '#006466', '#0a9396', '#48cae4'],
    angle: 145,
    locations: [0, 0.25, 0.5, 0.75, 1],
  },
  {
    id: 'bg_marble',
    colors: ['#0a0800', '#1a1200', '#2d2000', '#1a1200', '#0a0800'],
    angle: 135,
    locations: [0, 0.25, 0.5, 0.75, 1],
  },
  {
    id: 'bg_bauhaus',
    colors: ['#1a0000', '#001a33', '#1a1a00', '#00001a'],
    angle: 120,
    locations: [0, 0.33, 0.66, 1],
  },
  {
    id: 'bg_neon_city',
    colors: ['#0d0221', '#2d0057', '#ff00aa', '#00fff0', '#ff6600'],
    angle: 160,
    locations: [0, 0.2, 0.5, 0.75, 1],
  },
  {
    id: 'bg_void',
    colors: ['#000008', '#03051a', '#080d3a', '#0d1660', '#1a2080', '#03020f'],
    angle: 140,
    locations: [0, 0.12, 0.35, 0.58, 0.78, 1],
  },
];
