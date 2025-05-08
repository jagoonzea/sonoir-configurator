import React, { useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

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
  onPositionUpdate?: (position: [number, number, number]) => void
}> = ({ position, onPositionUpdate }) => {
  const { camera, controls } = useThree();
  const positionRef = useRef(position);
  const isInitialRender = useRef(true);
  const isAnimating = useRef(false);
  const targetPosition = useRef(new THREE.Vector3());
  const startPosition = useRef(new THREE.Vector3());
  const startTime = useRef(0);
  const animationDuration = 1000; // 1 second transition
  
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
  
  // Track camera position changes and handle animation
  useFrame(() => {
    // Handle animation
    if (isAnimating.current) {
      const elapsed = performance.now() - startTime.current;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Ease function - cubic ease-out for smoother deceleration
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const t = easeOutCubic(progress);
      
      // Interpolate position
      camera.position.lerpVectors(
        startPosition.current,
        targetPosition.current,
        t
      );
      
      // Make sure camera looks at the center
      camera.lookAt(0, 0, 0);
      
      // End animation when complete
      if (progress >= 1) {
        isAnimating.current = false;
        
        // Force the final position exactly to avoid floating point errors
        camera.position.set(
          targetPosition.current.x,
          targetPosition.current.y,
          targetPosition.current.z
        );
        
        // Re-enable controls after positioning is complete
        if (controls && 'enabled' in controls) {
          (controls as any).enabled = true;
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
}> = ({ modelPath, materials, useOnlyWithGrille = true, highlightedPart }) => {
  const gltf = useGLTF(modelPath);
  const originalMaterials = useRef<Map<THREE.Mesh, THREE.Material>>(new Map());
  const meshesLogged = useRef<boolean>(false);
  const lastMaterials = useRef<string>('');
  
  // Store original materials on first render and log mesh names once
  useEffect(() => {
    if (originalMaterials.current.size === 0) {
      console.log('Mesh names in model:');
      gltf.scene.traverse((child: any) => {
        if (child.isMesh) {
          originalMaterials.current.set(child, child.material);
          if (!meshesLogged.current) {
            console.log(`- ${child.name}`);
          }
        }
      });
      meshesLogged.current = true;
    }
  }, [gltf]);
  
  // Apply materials based on part names and handle mesh visibility
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
        }
      }
    });
  }, [materials, gltf, useOnlyWithGrille, highlightedPart]);

  return <primitive object={gltf.scene} />;
};

const ModelViewer: React.FC<ViewerProps> = ({
  modelProps: { modelPath, materials, useOnlyWithGrille = true, highlightedPart },
  cameraAngle,
  onPositionUpdate
}) => {
  return (
    <Canvas camera={{ fov: 45 }}>
      <CameraController position={cameraAngle} onPositionUpdate={onPositionUpdate} />
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.6} 
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight 
        position={[-5, 5, -2]} 
        intensity={0.3} 
        color="#b0c4de" 
      />
      <Environment preset="warehouse" />
      <Model 
        modelPath={modelPath} 
        materials={materials} 
        useOnlyWithGrille={useOnlyWithGrille}
        highlightedPart={highlightedPart}
      />
      <OrbitControls 
        makeDefault
        enablePan={false}
        enableRotate={true}
        enableZoom={true}
        dampingFactor={0.05}
        enableDamping={true}
        minDistance={30}
        maxDistance={100}
      />
    </Canvas>
  );
};

export default ModelViewer;
