const fs = require('fs');
const path = require('path');

// A valid 32x32 Green Circle PNG
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABZ0RVh0Q3JlYXRpb24gVGltZQAxMC8yOS8xMiHZxiMAAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzVxteM2AAABsklEQVRYhcWXsU7DMBRFTywgVijKwIAy8Qv8Gx/D2q1LpFy78AtQGQASQkIFiY7I3Lp27CDiQ1w5UuW4se958X2xH4/H/P/lS8C1c85dO+fO3oEvoA+0wB3wCLwA3865j3fQx3O7wB3wBnw75z7fQU9F3/d9V1WVVVWlPM9T27ZpmiZVVZVS17Xq+z7+u/rL8xwoIc/z1HVdGgwGaTQapTiO02AwoLqu03K5THme/zmIuQ+0bZtGoxEFAkCj0SjVdZ0WiwU1TZPSNI2/D2LuA23bpiAIKAgCiki/309xHKfFYkHL5TIFQZBS13X8fRBzH6iqSoPBIIVhSGEYUhRFFIbh2+FwSFEUURS9P4i5D/R9nwYCAJ/q+z4tFouU53mcjL8PYu4Dfd+nMAwpCAMKwoCiKKLpdJqKosjT8fsg5j5Q13UajUap7/s0mUxSGIYUhiFFUUTT6TSNx+OU53mcjL8PYu4DeZ6ntm3TdDpN0+k0lWWZyrJMZVkmy7I0Ho/TeDxO/X7/z0HMfSClVPV9n6qqSnmep7Is02QySZPJJJVlmSzLfv6L/V0w59zYOXf2DnwBfaAF7oBHKf0BH/nCg+9/fL8AAAAASUVORK5CYII=';

const buffer = Buffer.from(base64Png, 'base64');
const publicPath = path.join(__dirname, '../public/icon.png');
const distPath = path.join(__dirname, '../dist/icon.png'); 

const distDir = path.dirname(distPath);
if (!fs.existsSync(distDir)){
    fs.mkdirSync(distDir, { recursive: true });
}

fs.writeFileSync(publicPath, buffer);
console.log('Updated public/icon.png with valid PNG');

try {
  fs.writeFileSync(distPath, buffer);
  console.log('Updated dist/icon.png with valid PNG');
} catch (e) {
  console.log('Skipping dist/icon.png');
}