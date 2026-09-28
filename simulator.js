// Physics Engine Simulator
// 物理引擎模拟器核心代码

const FPS = 120;
const DURATION = 5;
const FRAMES = FPS * DURATION;
const DT = 1 / FPS;

let simulationData = null;
let animationFrame = 0;
let isAnimating = false;

// 初始化事件监听
document.addEventListener('DOMContentLoaded', () => {
  initializeControls();
  simulate();
});

function initializeControls() {
  // 为所有滑块添加实时更新显示
  const sliders = document.querySelectorAll('input[type="range"]');
  sliders.forEach(slider => {
    slider.addEventListener('input', (e) => {
      const valId = 'val-' + e.target.id;
      const display = document.getElementById(valId);
      if (display) {
        let value = parseFloat(e.target.value);
        let suffix = '';
        
        if (e.target.id === 'response') suffix = 's';
        else if (e.target.id === 'wind-period') suffix = 's';
        
        display.textContent = value.toFixed(2).replace(/\.?0+$/, '') + suffix;
      }
    });
  });

  // 复选框变化时自动重新模拟
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (isAnimating) simulate();
    });
  });
}

function getParams() {
  return {
    // 基础参数
    x0: parseFloat(document.getElementById('x0').value),
    v0: parseFloat(document.getElementById('v0').value),
    mass: parseFloat(document.getElementById('mass').value),
    
    // 弹簧力
    enableSpring: document.getElementById('enable-spring').checked,
    k: parseFloat(document.getElementById('k').value),
    damping: parseFloat(document.getElementById('damping').value),
    
    // 重力
    enableGravity: document.getElementById('enable-gravity').checked,
    g: parseFloat(document.getElementById('g').value),
    
    // 风力
    enableWind: document.getElementById('enable-wind').checked,
    windForce: parseFloat(document.getElementById('wind-force').value),
    enableWindPeriodic: document.getElementById('enable-wind-periodic').checked,
    windPeriod: parseFloat(document.getElementById('wind-period').value),
    
    // 磁力
    enableMagnetic: document.getElementById('enable-magnetic').checked,
    magneticStrength: parseFloat(document.getElementById('magnetic-strength').value),
    magneticPos: parseFloat(document.getElementById('magnetic-pos').value),
    
    // 电场力
    enableElectric: document.getElementById('enable-electric').checked,
    electricStrength: parseFloat(document.getElementById('electric-strength').value),
    electricPos: parseFloat(document.getElementById('electric-pos').value),
    
    // 摩擦力
    enableStaticFriction: document.getElementById('enable-static-friction').checked,
    muStatic: parseFloat(document.getElementById('mu-static').value),
    vThreshold: parseFloat(document.getElementById('v-threshold').value),
    enableKineticFriction: document.getElementById('enable-kinetic-friction').checked,
    muKinetic: parseFloat(document.getElementById('mu-kinetic').value),
    
    // 空气阻力
    enableDrag: document.getElementById('enable-drag').checked,
    dragCoeff: parseFloat(document.getElementById('drag-coeff').value)
  };
}

function simulatePhysics(params) {
  const frames = [];
  let x = params.x0;
  let v = params.v0;
  const m = params.mass;
  
  // 计算弹簧的固有频率和阻尼系数
  const omega0 = Math.sqrt(params.k / m);
  const c = 2 * params.damping * omega0 * m;
  
  for (let i = 0; i < FRAMES; i++) {
    const t = i * DT;
    let F_total = 0;
    
    // 1. 弹簧力 F = -kx - cv
    if (params.enableSpring) {
      F_total += -params.k * x - c * v;
    }
    
    // 2. 重力 F = mg
    if (params.enableGravity) {
      F_total += m * params.g;
    }
    
    // 3. 风力
    if (params.enableWind) {
      if (params.enableWindPeriodic) {
        // 周期性风力 F = F0 * sin(2πt/T)
        F_total += params.windForce * Math.sin(2 * Math.PI * t / params.windPeriod);
      } else {
        // 恒定风力
        F_total += params.windForce;
      }
    }
    
    // 4. 磁力 F = k/r² (距离平方反比)
    if (params.enableMagnetic) {
      const r = x - params.magneticPos;
      const rAbs = Math.abs(r);
      if (rAbs > 1) {
        // 排斥力或吸引力（根据符号）
        F_total += -params.magneticStrength / (rAbs * rAbs) * Math.sign(r);
      }
    }
    
    // 5. 电场力 F = k/r² (距离平方反比)
    if (params.enableElectric) {
      const r = x - params.electricPos;
      const rAbs = Math.abs(r);
      if (rAbs > 1) {
        F_total += -params.electricStrength / (rAbs * rAbs) * Math.sign(r);
      }
    }
    
    // 6. 静摩擦力 (速度小于阈值时生效)
    if (params.enableStaticFriction && Math.abs(v) < params.vThreshold && Math.abs(v) > 0.01) {
      F_total += -params.muStatic * Math.sign(v);
    }
    
    // 7. 动摩擦力 (全程生效)
    if (params.enableKineticFriction && Math.abs(v) > 0.01) {
      F_total += -params.muKinetic * Math.sign(v);
    }
    
    // 8. 空气阻力 F = -Cv²
    if (params.enableDrag && Math.abs(v) > 0.01) {
      F_total += -params.dragCoeff * v * Math.abs(v);
    }
    
    // 计算加速度 a = F/m
    const a = F_total / m;
    
    frames.push({ t, x, v, a });
    
    // 更新速度和位置 (Euler method)
    v += a * DT;
    x += v * DT;
  }
  
  return frames;
}

function simulate() {
  const params = getParams();
  simulationData = simulatePhysics(params);
  
  drawChart('chart-position', 'x');
  drawChart('chart-velocity', 'v');
  drawChart('chart-acceleration', 'a');
  
  startAnimation();
}

function drawChart(canvasId, valueKey) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = 50;
  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;
  
  // 清空画布
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  
  // 提取数据
  const values = simulationData.map(f => f[valueKey]);
  const times = simulationData.map(f => f.t);
  
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const range = vMax - vMin;
  
  // 绘制坐标轴
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
  
  // 绘制零线
  ctx.strokeStyle = '#e5e5e5';
  ctx.setLineDash([5, 5]);
  const zeroY = padding + graphHeight - ((0 - vMin) / range) * graphHeight;
  if (zeroY >= padding && zeroY <= height - padding) {
    ctx.beginPath();
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(width - padding, zeroY);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  
  // 绘制曲线
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  
  for (let i = 0; i < values.length; i++) {
    const x = padding + (i / (values.length - 1)) * graphWidth;
    const y = padding + graphHeight - ((values[i] - vMin) / range) * graphHeight;
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  
  ctx.stroke();
  
  // 绘制刻度
  ctx.fillStyle = '#666';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  
  // 时间轴刻度
  for (let i = 0; i <= 5; i++) {
    const x = padding + (i / 5) * graphWidth;
    const t = (i / 5) * DURATION;
    ctx.fillText(t.toFixed(1) + 's', x, height - padding + 18);
  }
  
  // Y轴刻度
  ctx.textAlign = 'right';
  ctx.fillText(vMax.toFixed(0), padding - 10, padding + 5);
  if (zeroY >= padding && zeroY <= height - padding) {
    ctx.fillText('0', padding - 10, zeroY + 5);
  }
  ctx.fillText(vMin.toFixed(0), padding - 10, height - padding + 5);
  
  // Y轴标签
  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  const labels = { x: '位置 x(t)', v: '速度 v(t)', a: '加速度 a(t)' };
  ctx.fillText(labels[valueKey], 0, 0);
  ctx.restore();
  
  // X轴标签
  ctx.textAlign = 'center';
  ctx.fillText('时间 (秒)', width / 2, height - 10);
}

function startAnimation() {
  isAnimating = true;
  animationFrame = 0;
  animate();
}

function animate() {
  if (!isAnimating || animationFrame >= simulationData.length) {
    isAnimating = false;
    return;
  }
  
  const frame = simulationData[animationFrame];
  const ball = document.getElementById('ball');
  const container = document.getElementById('animation');
  const containerWidth = container.offsetWidth;
  
  // 映射位置到像素 (-200 ~ 200 映射到 0 ~ containerWidth)
  const pixelX = ((frame.x + 200) / 400) * (containerWidth - 40);
  ball.style.left = pixelX + 'px';
  
  animationFrame++;
  
  // 以实际时间速度播放 (120fps -> 实时)
  setTimeout(() => requestAnimationFrame(animate), 1000 / FPS);
}

function reset() {
  isAnimating = false;
  animationFrame = 0;
  
  // 重置所有滑块
  document.getElementById('x0').value = -150;
  document.getElementById('v0').value = 0;
  document.getElementById('mass').value = 1;
  document.getElementById('k').value = 60;
  document.getElementById('damping').value = 0.74;
  document.getElementById('g').value = 9.8;
  document.getElementById('wind-force').value = 20;
  document.getElementById('wind-period').value = 2;
  document.getElementById('magnetic-strength').value = 1000;
  document.getElementById('magnetic-pos').value = 50;
  document.getElementById('electric-strength').value = 800;
  document.getElementById('electric-pos').value = -50;
  document.getElementById('mu-static').value = 100;
  document.getElementById('v-threshold').value = 20;
  document.getElementById('mu-kinetic').value = 50;
  document.getElementById('drag-coeff').value = 0.5;
  
  // 重置复选框
  document.getElementById('enable-spring').checked = true;
  document.getElementById('enable-gravity').checked = false;
  document.getElementById('enable-wind').checked = false;
  document.getElementById('enable-wind-periodic').checked = false;
  document.getElementById('enable-magnetic').checked = false;
  document.getElementById('enable-electric').checked = false;
  document.getElementById('enable-static-friction').checked = false;
  document.getElementById('enable-kinetic-friction').checked = false;
  document.getElementById('enable-drag').checked = false;
  
  // 更新显示
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.dispatchEvent(new Event('input'));
  });
  
  simulate();
}
