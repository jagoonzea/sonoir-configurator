/**
 * Utility functions for saving and loading configurations
 */

// Type definitions
type Selection = {
  option: string;
  color: string;
};

// Define mappings for material options to single-letter codes
const OPTION_CODES: Record<string, string> = {
  'Plastic': 'P',
  'Wood': 'W',
  'Aluminium': 'A',
  'Leather': 'L',
  'None': 'N',
  'Fabric': 'F',
  'No Battery': '0',
  '6 hours': '6',
  '12 hours': '2',
  'Basic': 'B',
  'Premium': 'R'
};

// Define mappings for colors to single-letter codes
const COLOR_CODES: Record<string, string> = {
  'bg-white': 'w',
  'bg-black': 'b',
  'bg-sky-400': 's', 
  'bg-lime-400': 'l',
  'bg-red-400': 'r',
  'bg-purple-400': 'p',
  'bg-yellow-400': 'y',
  'bg-amber-200': 'a',
  'bg-amber-400': 'm',
  'bg-amber-600': 'o',
  'bg-stone-700': 'd',
  'bg-stone-900': 'k',
  'bg-slate-300': 'c',
  'bg-slate-400': 'g',
  'bg-transparent': 't'
};

// Reverse mappings for decoding
const OPTION_DECODE: Record<string, string> = Object.entries(OPTION_CODES).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }), {}
);

const COLOR_DECODE: Record<string, string> = Object.entries(COLOR_CODES).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }), {}
);

/**
 * Encodes the selections array into a simple string of letters
 */
export const encodeConfig = (selections: Selection[]): string => {
  try {
    // Format: option1 + color1 + option2 + color2 + ... (No environment code)
    const optionColorCodes = selections.map(selection => {
      const optionCode = OPTION_CODES[selection.option] || '-';
      // Special case for options that don't need colors
      if (selection.option === 'No Battery' || selection.option === '6 hours' || 
          selection.option === '12 hours' || selection.option === 'Basic' || 
          selection.option === 'Premium') {
        return optionCode + 'x'; // 'x' represents no color needed
      }
      const colorCode = COLOR_CODES[selection.color] || '-';
      return optionCode + colorCode;
    }).join('');
    
    return optionColorCodes;
  } catch (error) {
    console.error('Error encoding configuration:', error);
    return '';
  }
};

/**
 * Decodes a string of letters back into selections array
 */
export const decodeConfig = (code: string): { selections: Selection[] | null } => {
  try {
    if (!code || code.length < 1) return { selections: null };

    const selections: Selection[] = [];
    
    for (let i = 0; i < code.length; i += 2) {
      if (i + 1 >= code.length) break;
      
      const optionCode = code[i];
      const colorCode = code[i + 1];
      
      const option = OPTION_DECODE[optionCode] || '';
      const color = colorCode === 'x' ? '' : COLOR_DECODE[colorCode] || '';
      
      selections.push({ option, color });
    }
    
    return { selections };
  } catch (error) {
    console.error('Error decoding configuration:', error);
    return { selections: null };
  }
};

/**
 * Creates a shareable URL with the current configuration
 * Environment is no longer included in the shared URL
 */
export const createShareableLink = (selections: Selection[]): string => {
  if (typeof window === 'undefined') return '';
  
  const configCode = encodeConfig(selections) // Ignore environment parameter
  const baseUrl = window.location.origin;
  return `${baseUrl}?c=${configCode}`; // Using shorter parameter name
};

/**
 * Extracts configuration from URL if present
 */
export const getConfigFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('c');
};
