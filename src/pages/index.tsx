'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ModelViewer, { MaterialSelectionMap } from '@/components/ModelViewer';
import * as THREE from 'three';

// Define the structure of material selections for each step
type MaterialConfig = {
  title: string;
  partName: string; // The name or partial name of the mesh in the 3D model
  materials: {
    name: string;
    colors: string[];
  }[];
};

export default function Home() {
  // Define each step with its corresponding part name in the 3D model
  const steps: MaterialConfig[] = [
    // {
    //   title: 'Grille Part 1',
    //   partName: 'sonoirWithGrille_1',
    //   materials: [
    //     { name: 'Mesh', colors: ['bg-amber-600', 'bg-amber-900'] },
    //     { name: 'Metal', colors: ['bg-white', 'bg-black'] },
    //   ],
    // },
    {
      title: 'Center Part',
      partName: 'sonoirWithGrille_2',
      materials: [
        { name: 'Chrome', colors: ['bg-gray-300', 'bg-gray-500'] },
        { name: 'Aluminium', colors: ['bg-slate-300', 'bg-zinc-500'] },
      ],
    },
    {
      title: 'Front and Back Part',
      partName: 'sonoirWithGrille_3',
      materials: [
        { name: 'Carbon', colors: ['bg-neutral-800', 'bg-neutral-600'] },
        { name: 'Metal', colors: ['bg-white', 'bg-black'] },
      ],
    },
    // {
    //   title: 'Grille Part 4',
    //   partName: 'sonoirWithGrille_4',
    //   materials: [
    //     { name: 'Mesh', colors: ['bg-amber-600', 'bg-amber-900'] },
    //     { name: 'Aluminium', colors: ['bg-slate-300', 'bg-zinc-500'] },
    //   ],
    // },
    {
      title: 'Knobs',
      partName: 'sonoirWithGrille_5',
      materials: [
        { name: 'Chrome', colors: ['bg-gray-300', 'bg-gray-500'] },
        { name: 'Carbon', colors: ['bg-neutral-800', 'bg-neutral-600'] },
      ],
    },
    // {
    //   title: 'Grille Part 6',
    //   partName: 'sonoirWithGrille_6',
    //   materials: [
    //     { name: 'Metal', colors: ['bg-white', 'bg-black'] },
    //     { name: 'Mesh', colors: ['bg-amber-600', 'bg-amber-900'] },
    //   ],
    // },
    {
      title: 'Feet',
      partName: 'sonoirWithGrille_7',
      materials: [
        { name: 'Aluminium', colors: ['bg-slate-300', 'bg-zinc-500'] },
        { name: 'Chrome', colors: ['bg-gray-300', 'bg-gray-500'] },
      ],
    },
    {
      title: 'Grille Part 8',
      partName: 'sonoirWithGrille_8',
      materials: [
        { name: 'Carbon', colors: ['bg-neutral-800', 'bg-neutral-600'] },
        { name: 'Metal', colors: ['bg-white', 'bg-black'] },
      ],
    },
    {
      title: 'Grille Part 9',
      partName: 'sonoirWithGrille_9',
      materials: [
        { name: 'Mesh', colors: ['bg-amber-600', 'bg-amber-900'] },
        { name: 'Chrome', colors: ['bg-gray-300', 'bg-gray-500'] },
      ],
    },
    // {
    //   title: 'Grille Part 10',
    //   partName: 'sonoirWithGrille_10',
    //   materials: [
    //     { name: 'Aluminium', colors: ['bg-slate-300', 'bg-zinc-500'] },
    //     { name: 'Carbon', colors: ['bg-neutral-800', 'bg-neutral-600'] },
    //   ],
    // },
    {
      title: 'Grille Part 11',
      partName: 'sonoirWithGrille_11',
      materials: [
        { name: 'Metal', colors: ['bg-white', 'bg-black'] },
        { name: 'Mesh', colors: ['bg-amber-600', 'bg-amber-900'] },
      ],
    },
    // {
    //   title: 'Grille Part 12',
    //   partName: 'sonoirWithGrille_12',
    //   materials: [
    //     { name: 'Chrome', colors: ['bg-gray-300', 'bg-gray-500'] },
    //     { name: 'Aluminium', colors: ['bg-slate-300', 'bg-zinc-500'] },
    //   ],
    // },
  ];

  const totalSteps = steps.length;
  const [step, setStep] = useState(0);
  
  // Track selections for each part of the model
  const [selections, setSelections] = useState(
    steps.map(() => ({ material: '', color: '' }))
  );
  
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 0, 0]);
  
  const currentStep = steps[step];
  const currentSelection = selections[step];

  const selectedMaterialObj = currentStep.materials.find(
    (mat) => mat.name === currentSelection.material
  );

  const currentColors = selectedMaterialObj?.colors || [];

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handleMaterialSelect = (material: string) => {
    const updated = [...selections];
    updated[step] = { material, color: '' };
    setSelections(updated);
  };

  const handleColorSelect = (color: string) => {
    const updated = [...selections];
    updated[step] = { ...updated[step], color };
    setSelections(updated);
  };

  const progressPercent = ((step + 1) / totalSteps) * 100;
  // Remove the key to prevent recreating the component each time
  // const modelViewerKey = `model-viewer-${step}`; 

  // Camera angles for each step - optimized for each part
  const cameraAngles: [number, number, number][] = [
    [44.49, 22.57, 25.79],   // Part 1 - View from front-right
    [44.01, 18.35, -29.68],  // Part 2 - View from right side
    [0.57, 48.29, 28.66],   // Part 3 - View from front-left
    [15, 5, 15],   // Part 4 - View from top-right
    [5, -5, 20],   // Part 5 - View from bottom-front
    [20, 5, 5],    // Part 6 - View from right
    [-5, 10, 20],  // Part 7 - View from left
    [15, 15, 15],  // Part 8 - View from top-diagonal
    [10, -5, 15],  // Part 9 - View from bottom-right
    [0, 5, 25],    // Part 10 - Direct front view
    [25, 5, 0],    // Part 11 - Direct side view
    [15, 20, 15],  // Part 12 - View from top
  ];
  
  // Ensure we have a camera angle for each step
  useEffect(() => {
    if (cameraAngles.length < steps.length) {
      console.warn(`Missing camera angles: ${steps.length - cameraAngles.length} steps don't have defined angles`);
    }
  }, []);

  const materialMap: Record<string, THREE.Material> = {
    Mesh: new THREE.MeshStandardMaterial({ metalness: 0.3, roughness: 0.6 }),
    Metal: new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.2 }),
    Aluminium: new THREE.MeshStandardMaterial({ metalness: 0.8, roughness: 0.4 }),
    Carbon: new THREE.MeshStandardMaterial({ metalness: 0.6, roughness: 0.3 }),
    Chrome: new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.1 }),
  };
  
  // Create a map of all material selections to apply to the model
  const createMaterialsMap = (): MaterialSelectionMap => {
    const materialsMap: MaterialSelectionMap = {};
    
    steps.forEach((stepConfig, index) => {
      const selection = selections[index];
      
      // Only add to the materials map if a material has been selected
      if (selection.material) {
        const material = materialMap[selection.material] || new THREE.MeshStandardMaterial();
        
        // Create a new instance of the material to avoid shared materials
        const materialInstance = material.clone();
        
        // Apply color if available
        if (selection.color) {
          // Convert Tailwind classes to hex colors - using a more reliable method
          const colorMap: Record<string, string> = {
            'bg-amber-600': '#D97706',
            'bg-amber-900': '#78350F',
            'bg-white': '#FFFFFF',
            'bg-black': '#000000',
            'bg-slate-300': '#CBD5E1',
            'bg-zinc-500': '#71717A',
            'bg-neutral-800': '#262626',
            'bg-neutral-600': '#525252',
            'bg-gray-300': '#D1D5DB',
            'bg-gray-500': '#6B7280',
            'bg-red-500': '#EF4444',
            'bg-red-700': '#B91C1C',
          };
          
          const hexColor = colorMap[selection.color] || '#CCCCCC'; // Default fallback color
          
          // Only set color if we have a valid hex value
          if (hexColor) {
            if (materialInstance instanceof THREE.MeshStandardMaterial) {
              materialInstance.color = new THREE.Color(hexColor);
            }
          }
        }
        
        materialsMap[stepConfig.partName] = {
          material: materialInstance,
          color: selection.color,
          partName: stepConfig.partName
        };
      }
    });
    
    return materialsMap;
  };

  // Highlight the current part being edited
  const highlightCurrentPart = () => {
    const materialsMap: MaterialSelectionMap = createMaterialsMap();
    
    // Add a special highlight material for the current part if no selection has been made yet
    if (!selections[step].material) {
      materialsMap[currentStep.partName] = {
        material: new THREE.MeshStandardMaterial({ 
          emissive: new THREE.Color(0x666666),
          wireframe: false,
          transparent: true,
          opacity: 0.8
        }),
        color: '',
        partName: currentStep.partName
      };
    }
    
    return materialsMap;
  };

  return (
    <main className="h-screen">
      <div className="flex flex-col items-center w-full h-full">
        <div className="h-full w-full bg-slate-300 relative">
          {/* Model Preview */}
          <ModelViewer
            modelProps={{
              modelPath: '/models/sonoir.glb',
              materials: highlightCurrentPart(),
              useOnlyWithGrille: true, // Only use sonoirWithGrille parts
              highlightedPart: currentStep.partName // Pass the current part name to highlight
            }}
            cameraAngle={cameraAngles[step]}
            onPositionUpdate={setCameraPosition}
          />
          
          {/* Camera Position Display */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded font-mono text-sm">
            Camera: [{cameraPosition[0]}, {cameraPosition[1]}, {cameraPosition[2]}]
          </div>
          
          {/* Current part indicator */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded font-mono text-sm">
            Current Part: {currentStep.partName}
          </div>
        </div>

        <div className="h-fit w-full">
          {/* Header with arrows */}
          <div className="flex justify-between items-center w-full p-6">
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

            <h1 className="text-xl font-medium">{currentStep.title}</h1>

            <Image
              src="/arrowright.svg"
              alt="Next step"
              width={24}
              height={24}
              onClick={handleNext}
              className="transition-transform duration-200 ease-in-out hover:translate-x-1 cursor-pointer"
            />
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-300">
            <div
              className="h-full bg-[#F7B932] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Selections */}
          <div className="flex flex-col p-8 gap-6">
            {/* Material selection */}
            <div className="flex gap-4 justify-center">
              {currentStep.materials.map((mat) => (
                <button
                  key={mat.name}
                  onClick={() => handleMaterialSelect(mat.name)}
                  className={`px-6 py-3 rounded-full transition-all duration-200 border
                    ${
                      currentSelection.material === mat.name
                        ? 'border-black scale-105'
                        : 'border-neutral-300'
                    }
                    hover:shadow-md hover:scale-105 hover:cursor-pointer`}
                >
                  {mat.name}
                </button>
              ))}
            </div>

            {/* Color selection */}
            <div className="flex gap-2 justify-center min-h-[48px]">
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
