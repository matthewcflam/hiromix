import '@react-three/fiber';
import type { Mesh, Material } from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: {
        ref?: React.Ref<Mesh>;
        rotation?: [number, number, number];
        children?: React.ReactNode;
        [key: string]: any;
      };
      planeGeometry: {
        args?: [number, number, number, number];
        [key: string]: any;
      };
      shaderMaterial: {
        [key: string]: any;
        children?: React.ReactNode;
      };
    }
  }
}

export {};
