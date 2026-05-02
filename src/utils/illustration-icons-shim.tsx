import React from 'react';

type IconProps = {
    height?: string;
    width?: string;
    fill?: string;
    className?: string;
};

export const DerivLightGoogleDriveIcon = ({ height = '48px', width = '48px', className }: IconProps) => (
    <svg height={height} width={width} className={className} viewBox='0 0 87.3 78' xmlns='http://www.w3.org/2000/svg'>
        <path d='m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z' fill='#0066da' />
        <path d='m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z' fill='#00ac47' />
        <path d='m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z' fill='#ea4335' />
        <path d='m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z' fill='#00832d' />
        <path d='m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z' fill='#2684fc' />
        <path d='m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z' fill='#ffba00' />
    </svg>
);

export const DerivLightMyComputerIcon = ({ height = '48px', width = '48px', className }: IconProps) => (
    <svg height={height} width={width} className={className} viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect x='4' y='8' width='56' height='36' rx='4' fill='#D6E4FF' stroke='#85AAFF' strokeWidth='2' />
        <rect x='12' y='16' width='40' height='20' rx='2' fill='#FFFFFF' />
        <rect x='24' y='48' width='16' height='4' rx='2' fill='#85AAFF' />
        <rect x='16' y='52' width='32' height='4' rx='2' fill='#D6E4FF' stroke='#85AAFF' strokeWidth='2' />
    </svg>
);

export const DerivLightLocalDeviceIcon = ({ height = '48px', width = '48px', className }: IconProps) => (
    <svg height={height} width={width} className={className} viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect x='18' y='4' width='28' height='48' rx='5' fill='#D6E4FF' stroke='#85AAFF' strokeWidth='2' />
        <rect x='22' y='12' width='20' height='28' rx='2' fill='#FFFFFF' />
        <circle cx='32' cy='47' r='2.5' fill='#85AAFF' />
    </svg>
);

export const DerivLightBotBuilderIcon = ({ height = '48px', width = '48px', className }: IconProps) => (
    <svg height={height} width={width} className={className} viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect x='4' y='4' width='56' height='56' rx='8' fill='#D6E4FF' />
        <rect x='12' y='20' width='8' height='24' rx='2' fill='#85AAFF' />
        <rect x='24' y='12' width='8' height='32' rx='2' fill='#4B63FF' />
        <rect x='36' y='28' width='8' height='16' rx='2' fill='#85AAFF' />
        <rect x='48' y='16' width='8' height='28' rx='2' fill='#4B63FF' />
    </svg>
);

export const DerivLightQuickStrategyIcon = ({ height = '48px', width = '48px', className }: IconProps) => (
    <svg height={height} width={width} className={className} viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='32' cy='32' r='28' fill='#D6E4FF' />
        <path d='M20 42L28 30L34 38L42 24L50 36' stroke='#4B63FF' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' />
        <circle cx='20' cy='42' r='3' fill='#85AAFF' />
        <circle cx='50' cy='36' r='3' fill='#4B63FF' />
    </svg>
);

export const DerivLightEmptyCardboardBoxIcon = ({ height = '128px', width = '128px', className }: IconProps) => (
    <svg height={height} width={width} className={className} viewBox='0 0 128 128' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect x='16' y='48' width='96' height='64' rx='4' fill='#EEF2FF' stroke='#C5D0FF' strokeWidth='2' />
        <path d='M16 64H112' stroke='#C5D0FF' strokeWidth='2' />
        <path d='M48 48V32L64 24L80 32V48' fill='#D6E4FF' stroke='#85AAFF' strokeWidth='2' />
        <path d='M48 56H80' stroke='#85AAFF' strokeWidth='2' strokeLinecap='round' />
        <circle cx='64' cy='92' r='12' fill='#D6E4FF' stroke='#85AAFF' strokeWidth='2' />
        <path d='M64 84V96M58 90H70' stroke='#85AAFF' strokeWidth='2' strokeLinecap='round' />
    </svg>
);

export const DerivLightUserErrorIcon = ({ height = '120px', width = '120px', className }: IconProps) => (
    <svg height={height} width={width} className={className} viewBox='0 0 120 120' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='60' cy='60' r='56' fill='#FFF0F0' stroke='#FF8A8A' strokeWidth='2' />
        <circle cx='60' cy='48' r='16' fill='#FFD0D0' stroke='#FF8A8A' strokeWidth='2' />
        <path d='M28 96C28 78 43 64 60 64C77 64 92 78 92 96' stroke='#FF8A8A' strokeWidth='2' strokeLinecap='round' />
        <path d='M52 44L68 60M68 44L52 60' stroke='#FF4444' strokeWidth='2.5' strokeLinecap='round' />
    </svg>
);

export const DerivLightDeclinedPoaIcon = ({ height = '128px', width = '128px', className }: IconProps) => (
    <svg height={height} width={width} className={className} viewBox='0 0 128 128' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='64' cy='64' r='56' fill='#FFF8E6' stroke='#FFD166' strokeWidth='2' />
        <path d='M64 40V72' stroke='#FFB800' strokeWidth='5' strokeLinecap='round' />
        <circle cx='64' cy='88' r='4' fill='#FFB800' />
    </svg>
);
