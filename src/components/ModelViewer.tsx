import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

// Updated types to support multiple materials
type ViewerProps = {
  modelProps: {
    modelPath: string;
    materials: MaterialSelectionMap;
    useOnlyWithGrille?: boolean;
    highlightedPart?: string;
  };
  cameraAngle: [number, number, number];
  onPositionUpdate?: (position: [number, number, number]) => void;
  resetTrigger?: number; // Trigger to force camera position reset
  environment?: string; // Path to HDR environment map
};

export type MaterialSelection = {
  material: THREE.Material;
  color: string;
  partName: string;
};

export type MaterialSelectionMap = {
  [key: string]: MaterialSelection;
};

// Camera controller component to update camera position when props change
const CameraController: React.FC<{
  position: [number, number, number],
  onPositionUpdate?: (position: [number, number, number]) => void,
  resetTrigger?: number
}> = ({ position, onPositionUpdate, resetTrigger }) => {  const { camera, controls } = useThree();
  const positionRef = useRef(position);
  const isInitialRender = useRef(true);
  const isAnimating = useRef(false);
  const targetPosition = useRef(new THREE.Vector3());
  const startPosition = useRef(new THREE.Vector3());
  const startTime = useRef(0);
  const animationDuration = 1800; // 1.8 second transition for smoother feel
  const resetTriggerRef = useRef(resetTrigger);
  
  // Prevent OrbitControls from overriding our camera position
  useEffect(() => {
    // Disable controls temporarily during camera positioning
    if (controls && 'enabled' in controls) {
      const orbitControls = controls as any;
      
      if (isAnimating.current) {
        orbitControls.enabled = false;
      } else {
        // Re-enable controls after animation completes
        orbitControls.enabled = true;
      }
    }
  }, [controls, isAnimating.current]);
  
  // Set initial camera position and handle position changes
  useEffect(() => {
    // Always force position on first render
    if (isInitialRender.current) {
      camera.position.set(position[0], position[1], position[2]);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      isInitialRender.current = false;
      positionRef.current = [...position];
      return;
    }
    
    // Check if position prop has actually changed
    const hasPositionChanged = 
      positionRef.current[0] !== position[0] || 
      positionRef.current[1] !== position[1] || 
      positionRef.current[2] !== position[2];
      
    // Only start animation if position has changed (new step)
    if (hasPositionChanged) {
      // Store current and target positions
      startPosition.current.set(
        camera.position.x,
        camera.position.y,
        camera.position.z
      );
      targetPosition.current.set(position[0], position[1], position[2]);
      
      // Start animation
      startTime.current = performance.now();
      isAnimating.current = true;
      positionRef.current = [...position];
      
      // Reset orbit controls
      if (controls) {
        const orbitControls = controls as any;
        if ('reset' in orbitControls) {
          // Disable auto-rotation if it was enabled
          if (orbitControls.autoRotate) {
            orbitControls.autoRotate = false;
          }
          
          // Ensure controls will target the center after our animation completes
          orbitControls.target.set(0, 0, 0);
          orbitControls.update();
        }
      }
    }
  }, [camera, position, controls]);
    // Handle when reset trigger changes
  useEffect(() => {
    if (resetTrigger !== resetTriggerRef.current && !isInitialRender.current) {
      // Store current and target positions
      startPosition.current.set(
        camera.position.x,
        camera.position.y,
        camera.position.z
      );
      targetPosition.current.set(position[0], position[1], position[2]);
      
      // Start animation
      startTime.current = performance.now();
      isAnimating.current = true;
      resetTriggerRef.current = resetTrigger;
      
      // Reset orbit controls
      if (controls) {
        const orbitControls = controls as any;
        if ('reset' in orbitControls) {
          // Ensure controls will target the center after our animation completes
          orbitControls.target.set(0, 0, 0);
          orbitControls.update();
        }
      }
    }
  }, [resetTrigger, camera, controls, position]);
  
    // Track camera position changes and handle animation
  useFrame(() => {
    // Handle animation
    if (isAnimating.current) {
      const elapsed = performance.now() - startTime.current;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Use a single smooth easing function for the entire animation
      // This avoids the discontinuity between different easing functions      // Use a more refined easing function that slows down more gently at the end
      const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2);
      
      // Apply smooth easing to the entire animation curve
      const t = easeOutSine(progress);
      
      // Interpolate position with smooth easing
      camera.position.lerpVectors(
        startPosition.current,
        targetPosition.current,
        t
      );
      
      // Make sure camera looks at the center
      camera.lookAt(0, 0, 0);
        // End animation when complete, but avoid snapping
      if (progress >= 1) {
        // Only stop animation when we're extremely close to target (avoids visible snap)
        const currentPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
        const distance = currentPos.distanceTo(targetPosition.current);
        
        // If we're very close to the target, end the animation
        if (distance < 0.01) {
          isAnimating.current = false;
          
          // Re-enable controls after positioning is complete
          if (controls && 'enabled' in controls) {
            (controls as any).enabled = true;
          }
        }
      }
    }
    
    // Report position updates to parent
    if (onPositionUpdate) {
      const x = parseFloat(camera.position.x.toFixed(2));
      const y = parseFloat(camera.position.y.toFixed(2));
      const z = parseFloat(camera.position.z.toFixed(2));
      onPositionUpdate([x, y, z]);
    }
  });
  
  return null;
};

// OrbitControls wrapper to provide reset functionality and key for forcing recreation
const ControlsWrapper: React.FC<{ cameraAngle: [number, number, number] }> = ({ cameraAngle }) => {
  const controlsRef = useRef<any>(null);
  
  // Use an effect to reset controls when camera angle changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [cameraAngle]);
  
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableRotate={true}
      enableZoom={true}
      dampingFactor={0.05}
      // Use a key based on camera angle to force re-creation when angle changes
      key={`controls-${cameraAngle.join('-')}`}
    />
  );
};

const Model: React.FC<{ 
  modelPath: string;
  materials: MaterialSelectionMap;
  useOnlyWithGrille?: boolean;
  highlightedPart?: string;
  isDesktop?: boolean; 
}> = ({ modelPath, materials, useOnlyWithGrille = true, highlightedPart, isDesktop }) => {
  // Set a low detail level for the model on mobile
  const gltf = useGLTF(modelPath, true, isDesktop ? false : true); // Use draco on mobile for better performance
  gltf.scene.position.y = isDesktop ? 8 : 3;
  const originalMaterials = useRef<Map<THREE.Mesh, THREE.Material>>(new Map());
  const lastMaterials = useRef<string>('');
  
  // Cleanup function to dispose of materials and geometries when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup materials and geometries when the model changes or unmounts
      gltf.scene.traverse((child: any) => {
        if (child.isMesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material: THREE.Material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    };
  }, [gltf]);
  
  // Store original materials on first render and log mesh names once
  useEffect(() => {
    if (originalMaterials.current.size === 0) {
      gltf.scene.traverse((child: any) => {
        if (child.isMesh) {
          originalMaterials.current.set(child, child.material);
        }
      });
    }
  }, [gltf]);
    // Apply materials based on part names and handle mesh visibility - with memory management
  useEffect(() => {
    // Convert materials to string for comparison to prevent infinite loops
    const materialsString = JSON.stringify(
      Object.keys(materials).map(key => ({
        key,
        color: materials[key].color,
        type: materials[key].material.type
      }))
    );
    
    // Only update materials when they actually change
    if (materialsString === lastMaterials.current) {
      return;
    }
    
    // Store old materials for disposal
    const oldMaterials: THREE.Material[] = [];
    
    // First traverse to collect old materials for disposal
    gltf.scene.traverse((child: any) => {
      if (child.isMesh && child.material && !originalMaterials.current.has(child)) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat: THREE.Material) => oldMaterials.push(mat));
        } else {
          oldMaterials.push(child.material);
        }
      }
    });
    
    lastMaterials.current = materialsString;
    
    // Apply selected materials to specific parts
    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        // Handle mesh visibility based on useOnlyWithGrille prop
        if (useOnlyWithGrille) {
          if (child.name.includes('sonoirWithGrille')) {
            child.visible = true;
          } else {
            child.visible = false; // Hide any non-grille parts
          }
        }
        
        // Apply materials from parent component - don't add our own highlighting
        // This ensures we don't override the enhanced highlighting from index.tsx
        for (const key in materials) {
          const materialSelection = materials[key];
          
          if (child.name === materialSelection.partName) {
            // Create a new instance to avoid shared materials
            const newMaterial = materialSelection.material.clone();
            
            // Preserve properties from the current material if it exists
            if (child.material) {
              newMaterial.name = child.material.name;
            }

            
            child.material = newMaterial;
            break;
          }
        }      }
    });
    
    // Dispose of old materials after we've applied the new ones
    setTimeout(() => {
      oldMaterials.forEach(material => {
        if (material && material.dispose) {
          material.dispose();
        }
      });
      
      // Force texture cleanup
      if (!isDesktop) {
        THREE.Cache.clear();
      }
    }, 100);
  }, [materials, gltf, useOnlyWithGrille, highlightedPart, isDesktop]);

  return <primitive object={gltf.scene} />;
};

// Loading overlay component that displays only during actual loading
const LoadingOverlay = () => {
  const { progress, active } = useProgress();
  
  // Only show when actively loading
  if (!active && progress >= 100) return null;
  
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
      <div className="mb-3">
        <svg width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#fff">
          <g fill="none" fillRule="evenodd">
            <g transform="translate(1 1)" strokeWidth="2">
              <circle strokeOpacity=".5" cx="18" cy="18" r="18"/>
              <path d="M36 18c0-9.94-8.06-18-18-18">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 18 18"
                  to="360 18 18"
                  dur="1s"
                  repeatCount="indefinite"/>
              </path>
            </g>
          </g>
        </svg>
      </div>
      <div className="text-white font-bold text-lg">{Math.round(progress)}%</div>
    </div>
  );
};

// Helper function to determine the correct environment path based on device
const getEnvironmentPath = (environment: string, isDesktop: boolean): string => {
  // Use no environment on mobile if memory is a concern
  if (!environment) {
    return isDesktop ? '/environments/appartement.hdr' : '/environments/appartement_small.jpg';
  }
  
  // If a specific environment is requested, use the _small version for mobile with jpg extension
  if (!isDesktop) {
    try {
      // Get the base name without extension
      const baseName = environment.split('/').pop()?.split('.')[0];
      // For mobile, use the _small.jpg version which is much smaller
      return `/environments/${baseName}_small.jpg`;
    } catch (error) {
      // Fallback if there's any error
      return '/environments/appartement_small.jpg';
    }
  }
  
  return environment;
};

// Custom Environment wrapper component to handle environment switching and memory management
const EnvironmentWrapper = ({ files, isDesktop, ...props }: { files: string, isDesktop: boolean, [key: string]: any }) => {
  const [textureKey, setTextureKey] = useState(`env-${files}`);
  
  // Memory management
  useEffect(() => {
    // Force recreation when files change by updating key
    setTextureKey(`env-${files}-${Date.now()}`);
    
    // Create cleanup function that runs when component unmounts or before rerender with new props
    return () => {
      // Force garbage collection of textures when component unmounts or changes
      if (window.gc) {
        try {
          window.gc();
        } catch (e) {
          console.log('GC not available');
        }
      }
      
      // Manually dispose of any textures in the cache
      THREE.Cache.clear();
    };
  }, [files]);
  
  return (
    <Environment
      key={textureKey}
      files={files}
      resolution={1024}
      {...props}
    />
  );
};

// Mobile memory management utility
const useMobileMemoryManagement = (isDesktop: boolean) => {
  useEffect(() => {
    if (isDesktop) return;

    // Setup interval to clear memory cache on mobile
    const cleanupInterval = setInterval(() => {
      THREE.Cache.clear();
      
      // Try to force garbage collection when available
      if (window.gc) {
        try {
          window.gc();
        } catch (e) {
          // GC not available in this browser
        }
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(cleanupInterval);
      THREE.Cache.clear();
    };
  }, [isDesktop]);
};

const ModelViewer: React.FC<ViewerProps> = ({
  modelProps: { modelPath, materials, useOnlyWithGrille = true, highlightedPart },
  cameraAngle,
  onPositionUpdate,  resetTrigger,
  environment = '' // No environment by default
}) => {
  // State to track if the viewport is desktop or mobile
  const [isDesktop, setIsDesktop] = useState(false);
  // State to track environment changes to trigger loading overlay
  const [showEnvironmentLoading, setShowEnvironmentLoading] = useState(true);
  // Track which environments have been loaded already
  const loadedEnvironments = useRef(new Set<string>());
  // Track if this is the first load
  const isInitialLoad = useRef(true);
  
  // Apply memory management for mobile devices
  useMobileMemoryManagement(isDesktop);
  
  // Check if the viewport is desktop on mount and when window resizes
  React.useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 768); // 768px is standard md breakpoint in Tailwind
    };
    
    checkIfDesktop();
    
    window.addEventListener('resize', checkIfDesktop);
    
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);  React.useEffect(() => {
    const envPath = getEnvironmentPath(environment, isDesktop);
    
    // Only show loading screen if this environment hasn't been loaded before
    const shouldShowLoading = !loadedEnvironments.current.has(envPath);
    setShowEnvironmentLoading(shouldShowLoading);
    
    THREE.Cache.clear();
    
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
    
    // Track this environment if it's not already tracked
    if (!loadedEnvironments.current.has(envPath)) {
      // We only need to track 3 environments (all that exist in the app)
      // This logic works the same for both mobile and desktop
      if (loadedEnvironments.current.size >= 3) {
        // If we already have 3 environments tracked, remove the oldest one
        const environments = Array.from(loadedEnvironments.current);
        loadedEnvironments.current.delete(environments[0]);
      }
      
      // Mark this environment as loaded immediately - no minimum duration
      loadedEnvironments.current.add(envPath);
      
      return () => {
        // Force garbage collection if available
        if (!isDesktop && window.gc) {
          try {
            window.gc();
          } catch (e) {
            console.log('GC not available');
          }
        }
      };
    } else {
      // Environment is already loaded, we can skip showing the loading screen
      setShowEnvironmentLoading(false);
    }
  }, [environment, isDesktop]);
  const [envError, setEnvError] = useState(false);
  
  // Error handling for environment loading
  const handleEnvError = useCallback(() => {
    console.log("Environment loading error, using fallback lighting");
    setEnvError(true);
  }, []);

  return (
    <div className="relative w-full h-full">
      <Canvas 
        camera={{ fov: 60 }} 
        gl={{ 
          toneMappingExposure: 1.2,
          // Add memory management settings for WebGL context
          powerPreference: 'high-performance',
          antialias: isDesktop, // Disable antialiasing on mobile
          precision: isDesktop ? 'highp' : 'mediump', // Lower precision on mobile
        }}
        // Optimize for performance on mobile
        frameloop={isDesktop ? 'always' : 'demand'} 
        performance={{ min: 0.5 }}
        dpr={[1, 2]}
      >
        <CameraController position={cameraAngle} onPositionUpdate={onPositionUpdate} resetTrigger={resetTrigger} />
        <color attach="background" args={['#e7e5e4']} /> {/* stone-200 color always visible when no environment background */}
        
        {/* Enhanced lighting for mobile devices or when environment fails */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={0.8} 
          castShadow={isDesktop}
          shadow-mapSize={isDesktop ? [1024, 1024] : [256, 256]}
        />
        <directionalLight 
          position={[-5, 5, -2]} 
          intensity={0.5} 
          color="#b0c4de" 
        />
        <Suspense fallback={null}>
          {!isDesktop ? (
            <EnvironmentWrapper
              files={getEnvironmentPath(environment, false)}
              background={environment ? true : false} // Don't show as background on mobile
              isDesktop={false}
              blur={0}
              onError={handleEnvError}
            />
          ) : (            <EnvironmentWrapper 
              files={getEnvironmentPath(environment, true)}
              background={environment ? true : false} // Only show as background when environment is explicitly selected
              isDesktop={true}
              blur={0}
              onError={handleEnvError}
            />
          )}
        </Suspense>
        <Model
          modelPath={modelPath} 
          materials={materials} 
          useOnlyWithGrille={useOnlyWithGrille}
          highlightedPart={highlightedPart}
          isDesktop={isDesktop}
        />
        <OrbitControls 
          makeDefault
          enablePan={false}
          enableRotate={true}
          enableZoom={true}
          dampingFactor={0.05}
          enableDamping={true}
          minDistance={isDesktop ? 25 : 20}
          maxDistance={100}
        />
      </Canvas>
      {showEnvironmentLoading && <LoadingOverlay />}
    </div>
  );
};

export default ModelViewer;
