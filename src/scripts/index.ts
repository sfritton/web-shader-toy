import { GameOfLifeShader } from './GameOfLife';

const canvas = document.querySelector<HTMLCanvasElement>('canvas');

new GameOfLifeShader(canvas);
