export const pointOnCircle = (radius: number, angle: number) => {
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);

  return { x, y };
};

export const randomVector = (radius: number) => {
  const r = Math.sqrt(Math.random()) * radius;
  const angle = Math.random() * 2 * Math.PI;
  return pointOnCircle(r, angle);
};
