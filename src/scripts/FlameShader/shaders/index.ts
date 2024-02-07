import * as constants from '../constants';
// @ts-expect-error
import renderParticles from 'bundle-text:./renderParticles.wgsl';
// @ts-expect-error
import computeParticles from 'bundle-text:./computeParticles.wgsl';
// @ts-expect-error
import renderBackground from 'bundle-text:./renderBackground.wgsl';

const withConstants = (shader: string) =>
  shader.replace(
    /\$\{([A-Z_]+)\}/g,
    (_, variableName: string) => (constants as Record<string, any>)[variableName],
  );

export const renderParticlesShader = withConstants(renderParticles);
export const computeParticlesShader = withConstants(computeParticles);
export const renderBackgroundShader = withConstants(renderBackground);
