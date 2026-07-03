import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage } from '@react-three/drei';

function BarramundiModel(props) {
  const { scene } = useGLTF('/assets/models/barramundi-fish.glb');
  return <primitive object={scene} {...props} />;
}

useGLTF.preload('/assets/models/barramundi-fish.glb');

export function Fish3D() {
  return (
    <div
      style={{
        width: 'min(480px, 90vw)',
        aspectRatio: '4 / 3',
        margin: '10px auto',
        flexShrink: 0,
        cursor: 'grab',
      }}
      title="Sleep om de vis te draaien!"
    >
      <Canvas camera={{ position: [0, 0, 0.9], fov: 40 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} shadows={false} adjustCamera={0.9}>
            <BarramundiModel />
          </Stage>
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={0.15}
          maxDistance={2.5}
          autoRotate
          autoRotateSpeed={90}
        />
      </Canvas>
    </div>
  );
}
