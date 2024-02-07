// TODO: update config so /index isn't necessary
import { FlameShader } from './FlameShader/index';

const canvas = document.querySelector<HTMLCanvasElement>('canvas');

new FlameShader(canvas);
