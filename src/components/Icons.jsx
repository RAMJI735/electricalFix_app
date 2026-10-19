import React from 'react';
import Svg, { Path, Circle, Rect, Polyline, Line, G } from 'react-native-svg';

export function HomeIcon({ size = 22, color = '#64748b', focused = false }) {
  const strokeColor = focused ? '#2563eb' : color;
  const fillColor = focused ? '#eff6ff' : 'none';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3l9 7.5v9.5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5z"
        stroke={strokeColor}
        strokeWidth={focused ? '2.2' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fillColor}
      />
    </Svg>
  );
}

export function ShopIcon({ size = 22, color = '#64748b', focused = false }) {
  const strokeColor = focused ? '#2563eb' : color;
  const fillColor = focused ? '#eff6ff' : 'none';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="2"
        stroke={strokeColor}
        strokeWidth={focused ? '2.2' : '1.8'}
        fill={focused ? '#2563eb' : 'none'}
      />
      <Rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="2"
        stroke={strokeColor}
        strokeWidth={focused ? '2.2' : '1.8'}
        fill={fillColor}
      />
      <Rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="2"
        stroke={strokeColor}
        strokeWidth={focused ? '2.2' : '1.8'}
        fill={focused ? '#2563eb' : 'none'}
      />
      <Rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="2"
        stroke={strokeColor}
        strokeWidth={focused ? '2.2' : '1.8'}
        fill={fillColor}
      />
    </Svg>
  );
}

export function CartIcon({ size = 22, color = '#64748b', focused = false }) {
  const strokeColor = focused ? '#2563eb' : color;
  const fillColor = focused ? '#eff6ff' : 'none';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="9"
        cy="20"
        r="1.5"
        stroke={strokeColor}
        strokeWidth={focused ? '2.2' : '1.8'}
        fill={strokeColor}
      />
      <Circle
        cx="18"
        cy="20"
        r="1.5"
        stroke={strokeColor}
        strokeWidth={focused ? '2.2' : '1.8'}
        fill={strokeColor}
      />
      <Path
        d="M2.5 3h3l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h9.8a1.8 1.8 0 0 0 1.8-1.4l1.6-7.2H6.6"
        stroke={strokeColor}
        strokeWidth={focused ? '2.2' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fillColor}
      />
    </Svg>
  );
}

export function ProfileIcon({ size = 22, color = '#64748b', focused = false }) {
  const strokeColor = focused ? '#2563eb' : color;
  const fillColor = focused ? '#eff6ff' : 'none';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="8"
        r="4"
        stroke={strokeColor}
        strokeWidth={focused ? '2.2' : '1.8'}
        fill={fillColor}
      />
      <Path
        d="M5 20c0-3.8 3.1-7 7-7s7 3.2 7 7"
        stroke={strokeColor}
        strokeWidth={focused ? '2.2' : '1.8'}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BoltIcon({ size = 20, color = '#f59e0b' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
      />
    </Svg>
  );
}

export function SearchIcon({ size = 18, color = '#64748b' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="11"
        cy="11"
        r="7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Line
        x1="20"
        y1="20"
        x2="16.2"
        y2="16.2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function StarIcon({ size = 14, color = '#f59e0b' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 16, color = '#10b981' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Polyline
        points="8 12 11 15 16 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrashIcon({ size = 16, color = '#ef4444' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PackageIcon({ size = 20, color = '#2563eb' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16.5 9.4L7.55 4.24a1.8 1.8 0 0 0-1.8 0L3.5 5.5a1.8 1.8 0 0 0-.9 1.56v9.88a1.8 1.8 0 0 0 .9 1.56l2.25 1.26a1.8 1.8 0 0 0 1.8 0l8.95-5.16a1.8 1.8 0 0 0 .9-1.56V11a1.8 1.8 0 0 0-.9-1.6z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="3.29 7 12 12 20.71 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="22" x2="12" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 18, color = '#64748b' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="9 18 15 12 9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowLeftIcon({ size = 20, color = '#0f172a' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="19" y1="12" x2="5" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="12 19 5 12 12 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 18, color = '#64748b' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ShieldCheckIcon({ size = 18, color = '#10b981' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="9 12 11 14 15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

