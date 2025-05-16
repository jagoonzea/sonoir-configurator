/**
 * Utility functions for saving and loading configurations
 */

// Type definitions
type Selection = {
  option: string;
  color: string;
};

/**
 * Encodes the selections array into a base64 string to be shared
 */
export const encodeConfig = (selections: Selection[], environment: string): string => {
  const configObj = {
    selections,
    environment
  };
  
  try {
    const jsonString = JSON.stringify(configObj);
    
    // Use Base64 encoding for a clean, shareable code
    if (typeof window !== 'undefined') {
      // URL-safe Base64 encoding (replace characters that are problematic in URLs)
      return btoa(jsonString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return '';
  } catch (error) {
    console.error('Error encoding configuration:', error);
    return '';
  }
};

/**
 * Decodes a base64 configuration string back into selections array
 */
export const decodeConfig = (code: string): { selections: Selection[], environment: string } | null => {
  try {
    if (typeof window !== 'undefined') {
      // Restore padding and URL-safe characters to standard base64
      const paddedCode = code.replace(/-/g, '+').replace(/_/g, '/');
      const padding = paddedCode.length % 4;
      const normalizedCode = padding ? paddedCode + '='.repeat(4 - padding) : paddedCode;
      
      const jsonString = atob(normalizedCode);
      const configObj = JSON.parse(jsonString);
      
      // Validate the structure
      if (Array.isArray(configObj.selections) && 
          configObj.selections.every((s: any) => 
            typeof s === 'object' && 
            ('option' in s) && 
            ('color' in s)
          )) {
        return configObj;
      }
    }
    return null;
  } catch (error) {
    console.error('Error decoding configuration:', error);
    return null;
  }
};

/**
 * Creates a shareable URL with the current configuration
 */
export const createShareableLink = (selections: Selection[], environment: string): string => {
  if (typeof window === 'undefined') return '';
  
  const configCode = encodeConfig(selections, environment);
  const baseUrl = window.location.origin;
  return `${baseUrl}?config=${configCode}`;
};

/**
 * Extracts configuration from URL if present
 */
export const getConfigFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('config');
};
