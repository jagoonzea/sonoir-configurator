'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import ModelViewer, { MaterialSelectionMap } from '@/components/ModelViewer';
import * as THREE from 'three';
import { HexColorPicker } from 'react-colorful';

type OptionConfig = {
  title: string;
  partName: string;
  options: string[];
  prices: Record<string, number>;
  noColorNeeded?: boolean;
};

const textureLoader = new THREE.TextureLoader();

const MATERIALS = {
  Plastic: [
    "bg-white",
    "bg-black",
    "bg-sky-400", 
    "bg-lime-400",
    "bg-red-400",
    "bg-purple-400",
    "bg-yellow-400"
  ],
  Wood: [
    "bg-amber-200", 
    "bg-stone-700"
  ],
  Aluminium: [
    "bg-slate-300", 
    "bg-stone-900",
    "bg-amber-400"
  ],
  Leather: [
    "bg-amber-600",
    "bg-white",
    "bg-black"
  ],
  None: [
    "bg-transparent"
  ],
  Fabric: [
    "bg-white",
    "bg-slate-400",
    "bg-black"
  ]
};

const COLOR_MAP: Record<string, string> = {
  'bg-sky-400': '#38BDF8',
  'bg-lime-400': '#A3E635',
  'bg-red-400': '#F87171',
  'bg-purple-400': '#C084FC',
  'bg-yellow-400': '#FACC15',
  'bg-white': '#FFFFFF',
  'bg-black': '#000000',
  'bg-amber-200': '#FDE68A',
  'bg-amber-400': '#FBBF24',
  'bg-amber-600': '#D97706',
  'bg-amber-900': '#000000',
  'bg-stone-700': '#57534E',
  'bg-stone-900': '#1C1917',
  'bg-slate-100': '#F1F5F9',
  'bg-slate-300': '#CBD5E1',
  'bg-slate-400': '#94A3B8',
  'bg-slate-700': '#334155',
  'bg-neutral-800': '#262626',
  'bg-neutral-600': '#525252',
  'bg-gray-300': '#D1D5DB',
  'bg-gray-500': '#6B7280',
  'bg-transparent': 'transparent'
};

export default function Home() {    // State for camera reset button
  const [showResetButton, setShowResetButton] = useState(false);
  // Add a reset key that will change to force camera reset
  const [cameraResetKey, setCameraResetKey] = useState(0);  
  // Background color states
  const [backgroundColor, setBackgroundColor] = useState('bg-stone-200');
  const [customBackgroundColor, setCustomBackgroundColor] = useState('#e7e5e4');
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [useCustomColor, setUseCustomColor] = useState(false);
  
  // Available background color options
  const backgroundColors = [
    { name: 'Light', class: 'bg-stone-200', color: '#e7e5e4' },
    { name: 'Dark', class: 'bg-slate-800', color: '#1e293b' },
    { name: 'Warm', class: 'bg-amber-50', color: '#fffbeb' },
  ];
  
  const steps: OptionConfig[] = [
    {
      title: "Center Part",
      partName: "sonoirWithGrille_2",
      options: ["Plastic", "Wood"],
      prices: {
        "Plastic": 0,
        "Wood": 20
      }
    },
    {
      title: "Side Panels",
      partName: "sonoirWithGrille_3",
      options: ["Plastic", "Wood"],
      prices: {
        "Plastic": 0,
        "Wood": 10
      }
    },
    {
      title: "Knobs",
      partName: "sonoirWithGrille_5",
      options: ["Plastic", "Aluminium"],
      prices: {
        "Plastic": 0,
        "Aluminium": 5
      }
    },
    {
      title: "Feet",
      partName: "sonoirWithGrille_7",
      options: ["Plastic", "Aluminium"],
      prices: {
        "Plastic": 0,
        "Aluminium": 15
      }
    },
    {
      title: "Grille",
      partName: "sonoirWithGrille_8",
      options: ["None", "Fabric"],
      prices: {
        "None": 0,
        "Fabric": 20
      }
    },
    {
      title: "StrapKnob",
      partName: "sonoirWithGrille_9",
      options: ["Plastic", "Aluminium"],
      prices: {
        "Plastic": 0,
        "Aluminium": 5
      }
    },
    {
      title: "Strap",
      partName: "sonoirWithGrille_11",
      options: ["None", "Leather"],
      prices: {
        "None": 0,
        "Leather": 20
      }
    },
    // Internal configuration steps
    {
      title: "Battery",
      partName: "internal_battery",
      options: ["No Battery", "6 hours", "12 hours"],
      prices: {
        "No Battery": 0,
        "6 hours": 30,
        "12 hours": 50
      },
      noColorNeeded: true
    },
    {
      title: "Sound",
      partName: "internal_speaker",
      options: ["Basic", "Premium"],
      prices: {
        "Basic": 0,
        "Premium": 50
      },
      noColorNeeded: true
    }
  ];

  const totalSteps = steps.length;
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState(steps.map(() => ({ option: '', color: '' })));
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [editingCard, setEditingCard] = useState<number | null>(null);
  
  const currentStep = steps[step];
  const currentSelection = selections[step];
  const currentColors = currentSelection.option ? MATERIALS[currentSelection.option as keyof typeof MATERIALS] || [] : [];


  const textures = useMemo(() => {
    const textureMap: Record<string, THREE.Texture> = {};
    
    const loadTextures = async () => {
      try {
        const lightWoodBaseUrl = '/textures/wood/light';
        textureMap['Wood_bg-amber-200_diffuse'] = textureLoader.load(`${lightWoodBaseUrl}_Color.jpg`);
        textureMap['Wood_bg-amber-200_normal'] = textureLoader.load(`${lightWoodBaseUrl}_NormalGL.jpg`);
        textureMap['Wood_bg-amber-200_roughness'] = textureLoader.load(`${lightWoodBaseUrl}_Roughness.jpg`);
        
        const darkWoodBaseUrl = '/textures/wood/dark';
        textureMap['Wood_bg-stone-700_diffuse'] = textureLoader.load(`${darkWoodBaseUrl}_Color.jpg`);
        textureMap['Wood_bg-stone-700_normal'] = textureLoader.load(`${darkWoodBaseUrl}_NormalGL.jpg`);
        textureMap['Wood_bg-stone-700_roughness'] = textureLoader.load(`${darkWoodBaseUrl}_Roughness.jpg`);
        
        const leatherBaseUrl = '/textures/leather/leather';
        const leatherDiffuse = textureLoader.load(`${leatherBaseUrl}_Color.jpg`);
        const leatherNormal = textureLoader.load(`${leatherBaseUrl}_NormalGL.jpg`);
        const leatherRoughness = textureLoader.load(`${leatherBaseUrl}_Roughness.jpg`);
        
        textureMap['Leather_bg-amber-600_diffuse'] = leatherDiffuse;
        textureMap['Leather_bg-amber-600_normal'] = leatherNormal;
        textureMap['Leather_bg-amber-600_roughness'] = leatherRoughness;
        
        textureMap['Leather_bg-amber-900_diffuse'] = leatherDiffuse.clone();
        textureMap['Leather_bg-amber-900_normal'] = leatherNormal;
        textureMap['Leather_bg-amber-900_roughness'] = leatherRoughness;
        
        textureMap['Leather_bg-slate-100_diffuse'] = leatherDiffuse.clone();
        textureMap['Leather_bg-slate-100_normal'] = leatherNormal;
        textureMap['Leather_bg-slate-100_roughness'] = leatherRoughness;
        
        const whiteFabricBaseUrl = '/textures/fabric/white';
        const whiteDiffuse = textureLoader.load(`${whiteFabricBaseUrl}_Color.jpg`);
        const whiteNormal = textureLoader.load(`${whiteFabricBaseUrl}_NormalGL.jpg`);
        const whiteRoughness = textureLoader.load(`${whiteFabricBaseUrl}_Roughness.jpg`);
        
        textureMap['Fabric_bg-white_diffuse'] = whiteDiffuse;
        textureMap['Fabric_bg-white_normal'] = whiteNormal;
        textureMap['Fabric_bg-white_roughness'] = whiteRoughness;
        
        textureMap['Fabric_bg-slate-400_normal'] = whiteNormal;
        textureMap['Fabric_bg-slate-400_roughness'] = whiteRoughness;
        textureMap['Fabric_bg-black_normal'] = whiteNormal;
        textureMap['Fabric_bg-black_roughness'] = whiteRoughness;
        
        textureLoader.load('/textures/fabric/grey_Color.jpg',
          (texture) => {
            textureMap['Fabric_bg-slate-400_diffuse'] = texture;
          },
          undefined,
          () => {
            const greyTexture = whiteDiffuse.clone();
            textureMap['Fabric_bg-slate-400_diffuse'] = greyTexture;
          }
        );
        
        textureLoader.load('/textures/fabric/black_Color.jpg',
          (texture) => {
            textureMap['Fabric_bg-black_diffuse'] = texture;
          },
          undefined,
          () => {
            const blackTexture = whiteDiffuse.clone();
            textureMap['Fabric_bg-black_diffuse'] = blackTexture;
          }
        );
        
        setTexturesLoaded(true);
      } catch (error) {
        console.error("Error loading textures:", error);
      }
    };
    
    loadTextures();
    return textureMap;
  }, []);
  
  const handlePrev = () => {
    if (showOverview) {
      // Close any open editing cards when leaving the overview
      setEditingCard(null);
      setShowOverview(false);
    } else if (step > 0) {
      setStep(step - 1);
    }
  };// Function to reset camera to current step's view
  const resetCameraView = () => {
    const btn = document.querySelector('.reset-camera-btn');
    
    // Check if the button is in disabled state
    if (btn && btn.getAttribute('data-disabled') === 'true') {
      // If camera is already at the right position, do nothing
      return;
    }
    
    // Clear any editing card but keep the current step
    setEditingCard(null);
    // Increment the reset key to trigger smooth animation
    setCameraResetKey(prev => prev + 1);
    
    // Add a small visual feedback on the button
    if (btn) {
      btn.classList.add('animate-pulse');
      setTimeout(() => {
        btn.classList.remove('animate-pulse');
        // Mark as disabled when animation completes
        btn.setAttribute('data-disabled', 'true');
      }, 600);
    }
  };

  const [showErrorMessage, setShowErrorMessage] = useState(false);

  const handleNext = () => {
    const currentSelection = selections[step];
    const currentStepConfig = steps[step];
    
    // Allow proceeding with just option selection if noColorNeeded is true
    if (currentSelection.option && (currentSelection.color || currentStepConfig.noColorNeeded)) {
      if (step < totalSteps - 1) {
        setStep(step + 1);
        setShowErrorMessage(false);
      } else if ( step === totalSteps - 1 && !showOverview) {
        // Show overview when completing last step
        setShowOverview(true);
        setShowErrorMessage(false);
      }
    } else {
      setShowErrorMessage(true);
      setTimeout(() => {
        setShowErrorMessage(false);
      }, 3000);
    }
  };

  const handleOptionSelect = (option: string) => {
    const updated = [...selections];
    const availableColors = MATERIALS[option as keyof typeof MATERIALS] || [];
    const firstColor = availableColors.length > 0 ? availableColors[0] : '';
    updated[step] = { option, color: firstColor };
    setSelections(updated);
  };

  const handleColorSelect = (color: string) => {
    const updated = [...selections];
    updated[step] = { ...updated[step], color };
    setSelections(updated);
  };

  const handleCardClick = (index: number) => {
    if (editingCard === index) {
      setEditingCard(null);
    } else {
      setEditingCard(index);
    }
  };

  const handleCardOptionSelect = (index: number, option: string) => {
    const updated = [...selections];
    const availableColors = MATERIALS[option as keyof typeof MATERIALS] || [];
    const firstColor = availableColors.length > 0 ? availableColors[0] : '';
    updated[index] = { option, color: firstColor };
    setSelections(updated);
  };

  const handleCardColorSelect = (index: number, color: string) => {
    const updated = [...selections];
    updated[index] = { ...updated[index], color };
    setSelections(updated);
  };

  const progressPercent = ((step + 1) / totalSteps) * 100;

  // State to track if the viewport is desktop or mobile
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if the viewport is desktop on mount and when window resizes
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 768); // 768px is standard md breakpoint in Tailwind
    };
    
    // Check on mount
    checkIfDesktop();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfDesktop);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);

  // Scale factor to move the camera further out while maintaining the same angles
  const scaleFactor = isDesktop ? 0.9 : 1; // Only apply zoom-out on desktop

  const cameraAngles: [number, number, number][] = [
    [44.49 * scaleFactor, 22.57 * scaleFactor, 25.79 * scaleFactor],
    [44.01 * scaleFactor, 18.35 * scaleFactor, -29.68 * scaleFactor],  
    [0.57 * scaleFactor, 48.29 * scaleFactor, 28.66 * scaleFactor],  
    [29.51 * scaleFactor, -18.23 * scaleFactor, 16.27 * scaleFactor], 
    [0.21 * scaleFactor, 12.97 * scaleFactor, 46.42 * scaleFactor],
    [35.4 * scaleFactor, -1.13 * scaleFactor, 0.99 * scaleFactor],
    [2.78 * scaleFactor, -15.08 * scaleFactor, -30.95 * scaleFactor],
    [15.0 * scaleFactor, 25.0 * scaleFactor, 35.0 * scaleFactor],     // Battery view
    [15.0 * scaleFactor, 25.0 * scaleFactor, 35.0 * scaleFactor]       // Speaker quality view
  ];
  
  useEffect(() => {
    if (cameraAngles.length < steps.length) {
      console.warn(`Missing camera angles: ${steps.length - cameraAngles.length} steps don't have defined angles`);
    }
  }, []);

  const materialMap: Record<string, THREE.Material> = {
    Plastic: new THREE.MeshStandardMaterial({ metalness: 0.0, roughness: 1.0 }),
    Wood: new THREE.MeshStandardMaterial({ metalness: 0.0, roughness: 0.8 }),
    Leather: new THREE.MeshStandardMaterial({ metalness: 0.1, roughness: 0.9 }),
    Metal: new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.2 }),
    Aluminium: new THREE.MeshStandardMaterial({ metalness: 0.8, roughness: 0.4 }),
    Carbon: new THREE.MeshStandardMaterial({ metalness: 0.6, roughness: 0.3 }),
    Chrome: new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.1 }),
    Fabric: new THREE.MeshStandardMaterial({ metalness: 0.0, roughness: 0.9 }),
    None: new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.0 })
  };
  
  const createMaterialsMap = (): MaterialSelectionMap => {
    const materialsMap: MaterialSelectionMap = {};
    
    const hardcodedParts = {
      "sonoirWithGrille_1": {
        material: new THREE.MeshStandardMaterial({ 
          color: new THREE.Color("#262626"),
          metalness: 0.6, 
          roughness: 0.3
        }),
        color: "bg-neutral-800",
        partName: "sonoirWithGrille_1"
      },
      "sonoirWithGrille_4": {
        material: new THREE.MeshStandardMaterial({ 
          color: new THREE.Color("#CBD5E1"),
          metalness: 0.9, 
          roughness: 0.2
        }),
        color: "bg-slate-300",
        partName: "sonoirWithGrille_4"
      },
      "sonoirWithGrille_6": {
        material: new THREE.MeshStandardMaterial({ 
          color: new THREE.Color("#1C1917"),
          metalness: 0.8, 
          roughness: 0.4
        }),
        color: "bg-stone-900",
        partName: "sonoirWithGrille_6"
      },
      "sonoirWithGrille_10": {
        material: new THREE.MeshStandardMaterial({ 
          color: new THREE.Color("#D1D5DB"),
          metalness: 1.0, 
          roughness: 0.1
        }),
        color: "bg-gray-300",
        partName: "sonoirWithGrille_10"
      },
      "sonoirWithGrille_12": {
        material: new THREE.MeshStandardMaterial({ 
          color: new THREE.Color("#D1D5DB"),
          metalness: 1.0, 
          roughness: 0.1
        }),
        color: "bg-gray-300",
        partName: "sonoirWithGrille_12"
      }
    };
    
    Object.keys(hardcodedParts).forEach(key => {
      materialsMap[key] = hardcodedParts[key as keyof typeof hardcodedParts];
    });
    
    steps.forEach((stepConfig, index) => {
      const selection = selections[index];
      
      if (selection.option) {
        const baseMaterial = materialMap[selection.option] || new THREE.MeshStandardMaterial();
        const materialInstance = baseMaterial.clone();
        
        if (selection.option === 'None') {
          materialInstance.transparent = true;
          materialInstance.opacity = 0.0;
          materialInstance.side = THREE.DoubleSide;
        } 
        else if (['Wood', 'Leather', 'Fabric'].includes(selection.option) && selection.color) {
          const hexColor = COLOR_MAP[selection.color] || '#CCCCCC';
          
          if (materialInstance instanceof THREE.MeshStandardMaterial) {
            materialInstance.color = new THREE.Color(hexColor);
            
            const textureKeyBase = `${selection.option}_${selection.color}`;
            
            const diffuseTexture = textures[`${textureKeyBase}_diffuse`];
            if (diffuseTexture) {
              materialInstance.map = diffuseTexture;
              diffuseTexture.wrapS = THREE.RepeatWrapping;
              diffuseTexture.wrapT = THREE.RepeatWrapping;
              diffuseTexture.repeat.set(0.1, 0.1);
            }
            
            const normalTexture = textures[`${textureKeyBase}_normal`];
            if (normalTexture) {
              materialInstance.normalMap = normalTexture;
              materialInstance.normalScale = new THREE.Vector2(0.1, 0.1);
              normalTexture.wrapS = THREE.RepeatWrapping;
              normalTexture.wrapT = THREE.RepeatWrapping;
              normalTexture.repeat.set(0.1, 0.1);
            }
            
            const roughnessTexture = textures[`${textureKeyBase}_roughness`];
            if (roughnessTexture) {
              materialInstance.roughnessMap = roughnessTexture;
              roughnessTexture.wrapS = THREE.RepeatWrapping;
              roughnessTexture.wrapT = THREE.RepeatWrapping;
              roughnessTexture.repeat.set(1, 1);
            }
          }
        } 
        else if (selection.color) {
          const hexColor = COLOR_MAP[selection.color] || '#CCCCCC';
          if (materialInstance instanceof THREE.MeshStandardMaterial) {
            materialInstance.color = new THREE.Color(hexColor);
          }
        }
        
        materialsMap[stepConfig.partName] = {
          material: materialInstance,
          color: selection.color,
          partName: stepConfig.partName
        };
      } else {
         materialsMap[stepConfig.partName] = {
           material: new THREE.MeshStandardMaterial({ 
             color: new THREE.Color(0xCCCCCC),
             metalness: 0.1,
             roughness: 0.9,
             transparent: false,
             opacity: 1.0
           }),
           color: '',
           partName: stepConfig.partName
         };
      }
    });
    
    return materialsMap;
  };

  const calculateTotalPrice = () => {
    const basePrice = 200;
    const optionsPrice = selections.reduce((total, selection, idx) => {
      return total + (selection.option && steps[idx].prices ? steps[idx].prices[selection.option] || 0 : 0);
    }, 0);
    
    const subtotal = basePrice + optionsPrice;
    const reservationFee = 49.99;
    const totalPrice = subtotal - reservationFee;
    
    return {
      subtotal,
      reservationFee,
      totalPrice
    };
  };

  const renderSelectionOrOverview = () => {
    if (showOverview) {
      return (
        <div className="flex flex-col h-full">
          {/* Scrollable cards container with flex-grow */}
          <div className="flex-1 overflow-y-auto pb-4 px-4 md:px-6 max-h-none">
            <div className="grid grid-cols-2 gap-3 pt-4 items-start">
              {steps.map((stepConfig, idx) => {
                const selection = selections[idx];
                if (!selection.option) return null;
                const isEditing = editingCard === idx;
                const optionColors = selection.option ? MATERIALS[selection.option as keyof typeof MATERIALS] || [] : [];
                
                // Different card style based on the image provided
                return (
                  <div 
                    key={idx} 
                    className={`bg-white rounded-2xl border border-stone-200 p-4 flex flex-col transition-all duration-300 h-auto justify-between self-start min-h-[130px] ${
                      isEditing ? 'shadow-lg border-amber-400' : 'hover:shadow-md'
                    } cursor-pointer`}
                    onClick={() => handleCardClick(idx)}
                  >
                    {/* Card header with title and price */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-stone-600 text-md">{stepConfig.title}</span>
                      <div className="flex items-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className={`text-stone-400 transition-transform duration-200 ${isEditing ? '-rotate-180' : ''}`}
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </div>
                    </div>
                    {/* Price display in large font */}
                    <div className="flex items-end gap-1 mb-2">
                    {stepConfig.prices[selection.option] == 0 ? (<span className="text-xl font-medium">Included</span>) : (<><span className="text-xl font-medium pb-[2px]">€</span><span className="text-3xl font-medium">{stepConfig.prices[selection.option]}</span></>)}
                    </div>
                    {/* Selected option display */}
                    <div className="flex items-center gap-4 pl-1">
                      <span className="text-stone-600 text-sm">{selection.option}</span>
                      {selection.color && !stepConfig.noColorNeeded && (
                        <div 
                          className={`w-4 h-4 rounded-full ${selection.color}`}
                          style={{border: '1px solid #ccc'}}
                        />
                      )}
                    </div>
                    {/* Options when editing - prevent clicks from bubbling */}
                    {isEditing && (
                      <div className="flex flex-col w-fit max-w-[200px] gap-3 mt-3 pt-3 border-t border-stone-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap gap-2 justify-start">
                          {stepConfig.options.map((option) => (
                            <button
                              key={option}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardOptionSelect(idx, option);
                              }}
                              className={`px-3 py-2 text-sm rounded-full transition-all duration-200 border
                                ${
                                  selection.option === option
                                    ? 'border-black bg-stone-100'
                                    : 'border-neutral-300'
                                }
                                hover:shadow-md hover:bg-stone-50`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        
                        {!stepConfig.noColorNeeded && optionColors.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 max-w-[200px]">
                            {optionColors.map((color) => (
                              <button
                                key={color}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCardColorSelect(idx, color);
                                }}
                                className={`w-8 h-8 rounded-full transition-all duration-200 border
                                  ${color}
                                  ${
                                    selection.color === color
                                      ? 'border-black scale-100'
                                      : 'border-neutral-300 scale-90'
                                  }
                                  hover:scale-100`}
                              ></button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Fixed footer with pricing that doesn't scroll */}
          <div className="flex-shrink-0 px-4 md:px-6 pb-4 pt-2 border-t border-stone-100">            
            <div className="mt-4 w-full bg-black rounded-2xl p-4 text-white">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-md text-gray-300">Subtotal:</span>
                  <div className="flex items-baseline">
                    <span className="text-xl">€</span>
                    <span className="text-2xl font-medium">{calculateTotalPrice().subtotal.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-md text-gray-300">Reservation fee:</span>
                  <div className="flex items-baseline text-green-400">
                    <span className="text-xl">-€</span>
                    <span className="text-2xl font-medium">{calculateTotalPrice().reservationFee.toFixed(2)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-700 my-2"></div>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-lg">Total:</span>
                  <div className="flex items-baseline">
                    <span className="text-2xl">€</span>
                    <span className="text-4xl font-medium">{calculateTotalPrice().totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>              <button 
                className="w-full py-2 px-3 bg-white text-black rounded-full hover:bg-amber-500 transition-colors text-md hover:cursor-pointer"
                onClick={() => window.open('https://sonoir.be/feedback', '_blank')}
              >
                Give feedback
              </button>
            </div>
          </div>
        </div>
      );
    }
    // Regular selection menu (non-overview mode)
    return (
      <div className="flex flex-col p-6 gap-4">
        <div className="flex gap-4 justify-center flex-wrap">
          {currentStep.options.map((option) => (
            <button
              key={option}
              onClick={() => handleOptionSelect(option)}
              className={`px-6 py-3 rounded-full transition-all duration-200 border
                ${
                  currentSelection.option === option
                    ? 'border-black scale-105'
                    : 'border-neutral-300'
                }
                hover:shadow-md hover:scale-105 hover:cursor-pointer`}
            >
              {currentStep.prices[option] == 0 ? option : `${option} + €${currentStep.prices[option]}`}
            </button>
          ))}
        </div>

        <div className="flex gap-2 justify-center min-h-[48px] flex-wrap max-w-md mx-auto">
          {currentColors.length > 0 ? (
            currentColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={`w-10 h-10 rounded-full transition-all duration-200 border
                  ${color}
                  ${
                    currentSelection.color === color
                      ? 'border-black scale-100'
                      : 'border-neutral-300 scale-70'
                  }
                  hover:scale-100 hover:cursor-pointer`}
              ></button>
            ))
          ) : (
            <div className="h-12" />
          )}
        </div>
      </div>
    );
  };

    return (
    <main 
      className={`h-svh ${showOverview ? 'overflow-auto' : 'overflow-hidden'} md:overflow-auto md:h-auto md:min-h-svh ${useCustomColor ? '' : backgroundColor} relative`}
      style={useCustomColor ? { backgroundColor: customBackgroundColor } : {}}
    >
      {/* Error notification at the top of the page - fixed for both mobile and desktop */}
      {showErrorMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity z-50 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Please select an option and color first
        </div>
      )}      <div className="flex flex-col items-center w-full h-full"><div 
          className={`w-full relative md:fixed md:h-full ${useCustomColor ? '' : backgroundColor} z-0 cursor-grab active:cursor-grabbing transition-all duration-300 ease-in-out ${
            showOverview ? '' : 'flex-grow'
          }`}
          style={useCustomColor ? { backgroundColor: customBackgroundColor } : {}}
        ><div className={`h-full  ${showOverview ? 'md:h-1/2' : 'md:h-full'} relative`}>
          <ModelViewer
              modelProps={{
                modelPath: '/models/sonoir.glb',
                materials: createMaterialsMap(),
                useOnlyWithGrille: true,
                highlightedPart: editingCard !== null ? steps[editingCard].partName : undefined
              }}
              cameraAngle={
                editingCard !== null ? cameraAngles[editingCard] : 
                showOverview ? [15.0, 20.0, 30.0] : 
                cameraAngles[step]
              }
              resetTrigger={cameraResetKey}onPositionUpdate={(position) => {
                setCameraPosition(position);
                
                // Calculate the distance from current position to current step's camera angle
                const currentPosition = new THREE.Vector3(position[0], position[1], position[2]);
                
                // Determine which camera angle should be the reference point
                const currentAngleIndex = editingCard !== null ? editingCard : 
                                         showOverview ? -1 : step;
                
                // Get the target position based on current context
                const targetPosition = new THREE.Vector3(
                  showOverview ? 15.0 * scaleFactor : cameraAngles[currentAngleIndex][0], 
                  showOverview ? 20.0 * scaleFactor : cameraAngles[currentAngleIndex][1], 
                  showOverview ? 30.0 * scaleFactor : cameraAngles[currentAngleIndex][2]
                );
                  // Track if camera has moved significantly from the current camera position
                const distance = currentPosition.distanceTo(targetPosition);
                // Always show the button, but we'll track if it's enabled or disabled
                setShowResetButton(true);
                // Pass the distance info to the button via data attribute
                const btn = document.querySelector('.reset-camera-btn');
                if (btn) {
                  if (distance <= 5) {
                    btn.setAttribute('data-disabled', 'true');
                  } else {
                    btn.setAttribute('data-disabled', 'false');
                  }
                }
              }}
            />            {/* Floating buttons container */}
            <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-10 flex items-center gap-3">
              {/* Background color button and menu */}
              <div className="relative">
                <button 
                  className="bg-white bg-opacity-90 rounded-full p-3 shadow-lg transition-all duration-200 flex items-center justify-center hover:scale-105"
                  onClick={() => setShowColorMenu(prev => !prev)}
                  title="Change background color"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v8M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M16 6l-4 4-4-4"/>
                  </svg>
                </button>
                  {/* Color options dropdown - conditionally shown */}
                {showColorMenu && (
                  <div className="absolute bottom-full mb-2 right-0 bg-white p-4 rounded-lg shadow-lg transition-all duration-300 flex flex-col gap-3">
                    {/* Color picker */}
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-gray-700">Custom Color</span>
                      <HexColorPicker 
                        color={customBackgroundColor} 
                        onChange={(color) => {
                          setCustomBackgroundColor(color);
                          setUseCustomColor(true);
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
                            
              {/* Camera reset button - always visible but can be disabled */}
              {showResetButton && (
                <button 
                  className="reset-camera-btn bg-white bg-opacity-90 rounded-full p-3 shadow-lg transition-all duration-200 flex items-center justify-center hover:scale-105"
                  data-disabled="false"
                  onClick={resetCameraView}
                  title="Reset camera view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6"/>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Bottom panel with dynamic height based on showOverview */}
        <div className={`w-full md:w-fit md:min-w-[550px] h-fit z-50 bottom-0 transition-all duration-300 ease-in-out bg-white md:rounded-3xl md:absolute ${
          showOverview ? 'md:top-[50svh]' : ' md:bottom-8'
        }`}>
          <div className="flex justify-between items-center w-full p-4 px-6 max-w-[600px] mx-auto">
            {(step > 0 || showOverview) ? (
              <Image
                src="/arrowleft.svg"
                alt="Previous step"
                width={24}
                height={24}
                onClick={handlePrev}
                className="transition-transform duration-200 ease-in-out hover:-translate-x-1 cursor-pointer"
              />
            ) : (
              <div className="w-6" />
            )}
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-medium">{showOverview ? "Order Summary" : currentStep.title}</h1>
            </div>

            {showOverview ? (
              <div className="w-6" />
            ) : step === totalSteps - 1 ? (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`transition-transform duration-200 ease-in-out hover:scale-110 cursor-pointer
                  ${!selections[step].option || (!selections[step].color && !steps[step].noColorNeeded) ? 'opacity-50' : 'opacity-100'}`}
                onClick={handleNext}
              >
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            ) : (
              <Image
                src="/arrowright.svg"
                alt="Next step"
                width={24}
                height={24}
                onClick={handleNext}
                className={`transition-transform duration-200 ease-in-out hover:translate-x-1 cursor-pointer
                  ${!selections[step].option || (!selections[step].color && !steps[step].noColorNeeded) ? 'opacity-50' : 'opacity-100'}`}
              />
            )}
          </div>
          <div className="w-full h-2 bg-stone-300">
            <div
              className="h-full bg-[#F7B932] transition-all duration-300"
              style={{ width: `${showOverview ? 100 : progressPercent}%` }}
            ></div>
          </div>
          <div className="mx-auto w-full" 
          >
            {renderSelectionOrOverview()}
          </div>
        </div>      </div>
    </main>
  );
}
