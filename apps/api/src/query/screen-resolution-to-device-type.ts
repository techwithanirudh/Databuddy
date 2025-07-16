// Utility to map screen resolution to device type

/**
 * Maps a screen resolution string (e.g., '375x812') to a device type.
 * @param screenResolution - The screen resolution string in 'widthxheight' format.
 * @returns 'mobile', 'tablet', 'laptop', 'desktop', 'ultrawide', or 'unknown'
 */
export function mapScreenResolutionToDeviceType(screenResolution: string): 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide' | 'unknown' {
    if (!screenResolution || typeof screenResolution !== 'string') return 'unknown';
    const parts = screenResolution.split('x');
    if (parts.length !== 2 || typeof parts[0] !== 'string') return 'unknown';
    const width = Number.parseInt(parts[0], 10);
    if (Number.isNaN(width)) return 'unknown';
    if (width <= 800) return 'mobile';
    if (width <= 1280) return 'tablet';
    if (width <= 1920) return 'laptop';
    if (width <= 2560) return 'desktop';
    if (width > 2560) return 'ultrawide';
    return 'unknown';
} 