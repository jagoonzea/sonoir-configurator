'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import ModelViewer, { MaterialSelectionMap } from '@/components/ModelViewer';
import * as THREE from 'three';

type MaterialConfig = {
  title: string;
  partName: string;
  materials: string[];
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

export default function Home() {
  const steps: MaterialConfig[] = [
    {
      title: "Center Part",
      partName: "sonoirWithGrille_2",
      materials: ["Plastic", "Wood"]
    },
    {
      title: "Front and Back Part",
      partName: "sonoirWithGrille_3",
      materials: ["Plastic", "Wood"]
    },
    {
      title: "Knobs",
      partName: "sonoirWithGrille_5",
      materials: ["Plastic", "Aluminium"]
    },
    {
      title: "Feet",
      partName: "sonoirWithGrille_7",
      materials: ["Plastic", "Aluminium"]
    },
    {
      title: "Grille",
      partName: "sonoirWithGrille_8",
      materials: ["None", "Fabric"]
    },
    {
      title: "StrapKnob",
      partName: "sonoirWithGrille_9",
      materials: ["Plastic", "Aluminium"]
    },
    {
      title: "Strap",
      partName: "sonoirWithGrille_11",
      materials: ["None", "Leather"]
    }
  ];

  const totalSteps = steps.length;
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState(steps.map(() => ({ material: '', color: '' })));
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  
  const currentStep = steps[step];
  const currentSelection = selections[step];
  const currentColors = currentSelection.material ? MATERIALS[currentSelection.material as keyof typeof MATERIALS] || [] : [];

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
    if (step > 0) setStep(step - 1);
  };

  const [showErrorMessage, setShowErrorMessage] = useState(false);

  const handleNext = () => {
    const currentSelection = selections[step];
    if (currentSelection.material && currentSelection.color) {
      if (step < totalSteps - 1) {
        setStep(step + 1);
        setShowErrorMessage(false);
      }
    } else {
      setShowErrorMessage(true);
      setTimeout(() => {
        setShowErrorMessage(false);
      }, 3000);
    }
  };

  const handleMaterialSelect = (material: string) => {
    const updated = [...selections];
    const availableColors = MATERIALS[material as keyof typeof MATERIALS] || [];
    const firstColor = availableColors.length > 0 ? availableColors[0] : '';
    updated[step] = { material, color: firstColor };
    setSelections(updated);
  };

  const handleColorSelect = (color: string) => {
    const updated = [...selections];
    updated[step] = { ...updated[step], color };
    setSelections(updated);
  };

  const progressPercent = ((step + 1) / totalSteps) * 100;

  const cameraAngles: [number, number, number][] = [
    [44.49, 22.57, 25.79],
    [44.01, 18.35, -29.68],  
    [0.57, 48.29, 28.66],  
    [29.51, -18.23, 16.27], 
    [0.21, 12.97, 46.42],
    [35.4, -1.13, 0.99],
    [2.78, -15.08, -30.95],
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
      
      if (selection.material) {
        const baseMaterial = materialMap[selection.material] || new THREE.MeshStandardMaterial();
        const materialInstance = baseMaterial.clone();
        
        if (selection.material === 'None') {
          materialInstance.transparent = true;
          materialInstance.opacity = 0.0;
          materialInstance.side = THREE.DoubleSide;
        } 
        else if (['Wood', 'Leather', 'Fabric'].includes(selection.material) && selection.color) {
          const hexColor = COLOR_MAP[selection.color] || '#CCCCCC';
          
          if (materialInstance instanceof THREE.MeshStandardMaterial) {
            materialInstance.color = new THREE.Color(hexColor);
            
            const textureKeyBase = `${selection.material}_${selection.color}`;
            
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

  return (
    <main className="h-svh overflow-hidden">
      <div className="flex flex-col items-center w-full h-full">
        <div className="flex-grow w-full bg-slate-300 relative">
          <ModelViewer
            modelProps={{
              modelPath: '/models/sonoir.glb',
              materials: createMaterialsMap(),
              useOnlyWithGrille: true,
            }}
            cameraAngle={cameraAngles[step]}
            onPositionUpdate={setCameraPosition}
          />
        </div>

        <div className="w-full shrink-0">
          <div className="flex justify-between items-center w-full p-4 px-6">
            {step > 0 ? (
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

            <h1 className="text-lg font-medium">{currentStep.title}</h1>

            {showErrorMessage && (
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-md shadow-md transition-opacity">
                Please select a material and color first
              </div>
            )}

            <Image
              src="/arrowright.svg"
              alt="Next step"
              width={24}
              height={24}
              onClick={handleNext}
              className={`transition-transform duration-200 ease-in-out hover:translate-x-1 cursor-pointer
                ${!selections[step].material || !selections[step].color ? 'opacity-50' : 'opacity-100'}`}
            />
          </div>

          <div className="w-full h-2 bg-slate-300">
            <div
              className="h-full bg-[#F7B932] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <div className="flex flex-col p-6 gap-4">
            <div className="flex gap-4 justify-center">
              {currentStep.materials.map((material) => (
                <button
                  key={material}
                  onClick={() => handleMaterialSelect(material)}
                  className={`px-6 py-3 rounded-full transition-all duration-200 border
                    ${
                      currentSelection.material === material
                        ? 'border-black scale-105'
                        : 'border-neutral-300'
                    }
                    hover:shadow-md hover:scale-105 hover:cursor-pointer`}
                >
                  {material}
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
        </div>
      </div>
    </main>
  );
}
