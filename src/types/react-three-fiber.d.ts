import '@react-three/fiber';
import type { Mesh, BufferGeometry, Material } from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: {
        ref?: React.Ref<Mesh>;
        rotation?: [number, number, number];
        position?: [number, number, number];
        scale?: [number, number, number];
        children?: React.ReactNode;
        [key: string]: any;
      };
      planeGeometry: {
        args?: [number, number, number, number];
        ref?: React.Ref<BufferGeometry>;
        children?: React.ReactNode;
        [key: string]: any;
      };
      shaderMaterial: {
        ref?: React.Ref<Material>;
        uniforms?: any;
        vertexShader?: string;
        fragmentShader?: string;
        side?: number;
        transparent?: boolean;
        children?: React.ReactNode;
        [key: string]: any;
      };
    }
  }
}

export {};

