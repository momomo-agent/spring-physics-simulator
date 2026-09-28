// 添加输入框同步和预设功能到 simulator.js
const fs = require('fs');

let js = fs.readFileSync('simulator.js', 'utf8');

// 1. 在 initializeControls 函数中添加输入框同步逻辑
const inputSyncCode = `
  // 同步所有 range 和 number input
  document.querySelectorAll('input[type="range"]').forEach(range => {
    const numberId = 'input-' + range.id;
    const numberInput = document.getElementById(numberId);
    if (!numberInput) return;
    
    // 初始化 number input
    numberInput.value = range.value;
    numberInput.min = range.min;
    numberInput.max = range.max;
    numberInput.step = range.step || 'any';
    
    // range 改变时更新 number
    range.addEventListener('input', () => {
      numberInput.value = range.value;
    });
    
    // number 改变时更新 range
    numberInput.addEventListener('input', () => {
      const val = parseFloat(numberInput.value);
      if (!isNaN(val)) {
        range.value = Math.max(range.min, Math.min(range.max, val));
        range.dispatchEvent(new Event('input'));
      }
    });
  });
`;

// 在 initializeControls 函数末尾添加
js = js.replace(
  /(function initializeControls\(\) \{[\s\S]*?)(\n\})/m,
  `$1\n${inputSyncCode}$2`
);

// 2. 添加预设管理功能
const presetCode = `
// 预设管理
let presets = JSON.parse(localStorage.getItem('physics-presets') || '{}');

function savePreset() {
  const name = document.getElementById('preset-name').value.trim();
  if (!name) {
    alert('请输入预设名称');
    return;
  }
  
  const state = {};
  document.querySelectorAll('input[type="range"], select').forEach(input => {
    state[input.id] = input.value;
  });
  
  presets[name] = state;
  localStorage.setItem('physics-presets', JSON.stringify(presets));
  document.getElementById('preset-name').value = '';
  renderPresets();
}

function loadPreset(name) {
  const state = presets[name];
  if (!state) return;
  
  Object.entries(state).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('change'));
    }
  });
  
  resetAnimation();
}

function deletePreset(name) {
  if (confirm(\`确定删除预设 "\${name}" 吗？\`)) {
    delete presets[name];
    localStorage.setItem('physics-presets', JSON.stringify(presets));
    renderPresets();
  }
}

function renderPresets() {
  const list = document.getElementById('preset-list');
  if (!list) return;
  
  list.innerHTML = Object.keys(presets).map(name => \`
    <div class="preset-item">
      <span class="preset-name">\${name}</span>
      <div class="preset-actions">
        <button class="load" onclick="loadPreset('\${name}')">加载</button>
        <button class="delete" onclick="deletePreset('\${name}')">删除</button>
      </div>
    </div>
  \`).join('');
}

// 初始化时渲染预设列表
document.addEventListener('DOMContentLoaded', () => {
  renderPresets();
});
`;

// 在文件开头添加预设功能
js = presetCode + '\n' + js;

fs.writeFileSync('simulator.js', js);
console.log('✅ JavaScript 功能增强完成');
