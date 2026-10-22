import { FRAG } from './shader.js';
const VERT = `#version 300 es
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}`;

export function createRenderer(canvas, opts = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
  if (!gl) throw new Error('WebGL2 is not available on this device or browser. Try an up-to-date Chrome, Edge, Firefox or Safari 15+, and enable hardware acceleration.');
  let prog = null, locs = {}, lost = false;
  const compile = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Shader compile error: ' + gl.getShaderInfoLog(s));
    return s;
  };
  function init() {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Shader link error: ' + gl.getProgramInfoLog(p));
    prog = p; locs = {};
  }
  init();
  const onLost = e => { e.preventDefault(); lost = true; opts.onLost && opts.onLost(); };
  const onRestored = () => { try { init(); lost = false; opts.onRestored && opts.onRestored(); } catch (e) { opts.onError && opts.onError(e); } };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  return {
    gl,
    maxSize: Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), gl.getParameter(gl.MAX_TEXTURE_SIZE)),
    draw(u) {
      if (lost) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog);
      for (const k in u) {
        if (!(k in locs)) locs[k] = gl.getUniformLocation(prog, k);
        const l = locs[k], v = u[k]; if (l === null) continue;
        if (typeof v === 'number') gl.uniform1f(l, v);
        else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
        else gl.uniform3f(l, v[0], v[1], v[2]);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (prog) gl.deleteProgram(prog);
      const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext();
    }
  };
}
