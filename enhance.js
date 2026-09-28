// 增强脚本：扩大范围 + 添加输入框 + 预设功能
const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. 扩大磁力/电场力/摩擦力范围
const rangeUpdates = [
  { id: 'magnetic-strength', max: '20000' },
  { id: 'electric-strength', max: '15000' },
  { id: 'mu-static', max: '1000' },
  { id: 'mu-kinetic', max: '800' },
  { id: 'v-threshold', max: '200' },
  { id: 'drag-coeff', max: '10' }
];

rangeUpdates.forEach(({ id, max }) => {
  const regex = new RegExp(`(<input type="range" id="${id}"[^>]*max=")[^"]+`, 'g');
  html = html.replace(regex, `$1${max}`);
});

// 2. 将所有滑块改为 slider + input 组合
html = html.replace(
  /<div class="control-item">\s*<label>([^<]+)<span class="value-display" id="val-([^"]+)">([^<]+)<\/span><\/label>\s*<input type="range" id="([^"]+)"([^>]+)>/g,
  `<div class="control-item">
          <label>$1<span class="value-display" id="val-$2">$3</span></label>
          <div class="input-group">
            <input type="range" id="$4"$5>
            <input type="number" class="number-input" id="input-$4" step="any">
          </div>
        </div>`
);

// 3. 在控制面板顶部添加预设管理
const presetHTML = `
      <div class="control-group preset-group">
        <h3>💾 预设管理</h3>
        <div class="preset-controls">
          <input type="text" id="preset-name" placeholder="输入预设名称" class="preset-input">
          <button onclick="savePreset()" class="preset-btn save">保存</button>
        </div>
        <div id="preset-list" class="preset-list"></div>
      </div>
`;

html = html.replace(
  /(<div class="controls">)/,
  `$1\n${presetHTML}`
);

// 4. 添加样式
const styles = `
    .input-group {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .input-group input[type="range"] {
      flex: 1;
    }
    .number-input {
      width: 70px;
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 12px;
      text-align: center;
    }
    .number-input:focus {
      outline: none;
      border-color: #667eea;
    }
    .preset-group {
      background: #f0f4ff;
      border: 2px solid #667eea;
      border-radius: 12px;
      padding: 16px !important;
    }
    .preset-controls {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    .preset-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 13px;
    }
    .preset-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .preset-btn.save {
      background: #667eea;
      color: white;
    }
    .preset-btn.save:hover {
      background: #5568d3;
    }
    .preset-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .preset-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }
    .preset-item:hover {
      border-color: #667eea;
      background: #fafbff;
    }
    .preset-name {
      font-weight: 500;
      color: #333;
    }
    .preset-actions {
      display: flex;
      gap: 6px;
    }
    .preset-actions button {
      padding: 4px 10px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .preset-actions .load {
      background: #667eea;
      color: white;
    }
    .preset-actions .load:hover {
      background: #5568d3;
    }
    .preset-actions .delete {
      background: #fee;
      color: #c33;
    }
    .preset-actions .delete:hover {
      background: #fcc;
    }
`;

html = html.replace('</style>', `${styles}\n  </style>`);

fs.writeFileSync('index.html', html);
console.log('✅ HTML 增强完成');
