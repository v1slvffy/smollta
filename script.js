const SMOLLTA_H = 1.46;
const IMG_SRC   = "euh.png";
const CHART_H   = 280;
const MAX_LIMIT = 4000;

const UNIT_TO_M = {
    mm: 0.001,
    cm: 0.01,
    dm: 0.1,
    m:  1,
    dam: 10,
    hm: 100,
    km: 1000
};

const UNIT_LABELS = {
    mm: 'mm', cm: 'cm', dm: 'dm', m: 'm', dam: 'dam', hm: 'hm', km: 'km'
};

let currentMode = 'u2s';

function setMode(mode) {
    currentMode = mode;
    document.getElementById('btnMeterToSmollta').classList.toggle('active', mode === 'u2s');
    document.getElementById('btnSmolltaToMeter').classList.toggle('active', mode === 's2u');

    document.getElementById('unitRowInput').style.display  = mode === 'u2s' ? 'flex' : 'none';
    document.getElementById('unitRowOutput').style.display = mode === 's2u' ? 'flex' : 'none';

    const inputLabel = document.getElementById('inputLabel');
    const inputEl    = document.getElementById('inputVal');

    if (mode === 'u2s') {
        const unit = document.getElementById('unitSelectInput').value;
        inputLabel.textContent = 'tinggi (' + unit + ')';
        inputEl.placeholder = 'angka';
    } else {
        inputLabel.textContent = 'smollta';
        inputEl.placeholder = 'jumlah smollta';
    }

    inputEl.value = '';
    clearResult();
}

function clearResult() {
    const hasilTeks   = document.getElementById('hasilTeks');
    const hasilTumpuk = document.getElementById('hasilTumpuk');
    hasilTeks.textContent = '';
    hasilTeks.classList.remove('visible');
    hasilTumpuk.innerHTML = '';
    hasilTumpuk.classList.remove('visible');
    document.getElementById('figureArea').innerHTML = '<span class="empty-hint">masukkan angka dulu~</span>';
    document.getElementById('ruler').innerHTML = '';
}

function formatNum(n) {
    if (n === 0) return '0';
    if (Math.abs(n) >= 0.001 && Math.abs(n) < 1e7) {
        let s = n.toPrecision(6);
        return parseFloat(s).toString();
    }
    return n.toExponential(4);
}

function formatTumpuk(n) {
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(2).replace(/\.?0+$/, '');
}

function hitung() {
    const hasilTeks   = document.getElementById('hasilTeks');
    const hasilTumpuk = document.getElementById('hasilTumpuk');
    const figureArea  = document.getElementById('figureArea');
    const rulerEl     = document.getElementById('ruler');
    
    const isStackActive = document.getElementById('toggleStack').checked;

    let rawInput = parseFloat(document.getElementById('inputVal').value);

    if (isNaN(rawInput) || rawInput <= 0) {
        clearResult();
        return;
    }

    let inputMeters;
    let resultText;
    let ratio;

    if (currentMode === 'u2s') {
        const selectedUnit = document.getElementById('unitSelectInput').value;
        const factor = UNIT_TO_M[selectedUnit];
        inputMeters = rawInput * factor;

        if (inputMeters > MAX_LIMIT) {
            inputMeters = MAX_LIMIT;
        }

        ratio = inputMeters / SMOLLTA_H;
        const unitLabel = UNIT_LABELS[selectedUnit];
        resultText = formatNum(rawInput) + " " + unitLabel + " = " + formatNum(ratio) + " smollta";

        hasilTumpuk.innerHTML = "setara <strong>" + formatTumpuk(ratio) + " smollta</strong> bertumpuk";
        hasilTumpuk.classList.add('visible');

        document.getElementById('inputLabel').textContent = 'tinggi (' + unitLabel + ')';

    } else {
        const smolltaCount = rawInput;
        inputMeters = smolltaCount * SMOLLTA_H;

        const selectedUnit = document.getElementById('unitSelectOutput').value;
        const factor = UNIT_TO_M[selectedUnit];
        const resultInUnit = inputMeters / factor;
        const unitLabel = UNIT_LABELS[selectedUnit];

        resultText = formatNum(smolltaCount) + " smollta = " + formatNum(resultInUnit) + " " + unitLabel;

        hasilTumpuk.innerHTML = '';
        hasilTumpuk.classList.remove('visible');

        if (inputMeters > MAX_LIMIT) inputMeters = MAX_LIMIT;
        ratio = smolltaCount;
    }

    hasilTeks.textContent = resultText;
    hasilTeks.classList.add('visible');

    const maxMeterInChart = Math.max(inputMeters, SMOLLTA_H) * 1.1;
    const pxPerM = CHART_H / maxMeterInChart;

    const figH   = Math.round(SMOLLTA_H * pxPerM);
    const inputY = Math.round(inputMeters * pxPerM);

    figureArea.innerHTML = '';
    rulerEl.innerHTML    = '';

    const niceIntervals = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    let interval = niceIntervals.find(iv => maxMeterInChart / iv <= 7) || 1000;

    for (let m = 0; m <= maxMeterInChart; m = +(m + interval).toFixed(8)) {
        const fromBottom = Math.round(m * pxPerM);
        if (fromBottom > CHART_H) break;

        const tick = document.createElement('div');
        tick.className = 'ruler-tick';
        tick.style.bottom = fromBottom + 'px';
        const span = document.createElement('span');
        span.textContent = m % 1 === 0 ? m + 'm' : m.toFixed(m < 1 ? 2 : 1) + 'm';
        tick.appendChild(span);
        rulerEl.appendChild(tick);

        if (m > 0) {
            const gl = document.createElement('div');
            gl.className = 'grid-line';
            gl.style.bottom = fromBottom + 'px';
            figureArea.appendChild(gl);
        }
    }

    const topLine = document.createElement('div');
    topLine.className = 'input-line';
    topLine.style.bottom = inputY + 'px';
    figureArea.appendChild(topLine);

    const wrapper = document.createElement('div');
    wrapper.className = 'figure-wrapper';
    wrapper.style.bottom = '0px';

    if (!isStackActive) {
        wrapper.style.height = figH + 'px';

        const topLabel = document.createElement('div');
        topLabel.className = 'fig-top-label';
        topLabel.textContent = formatNum(ratio) + " smollta";
        wrapper.appendChild(topLabel);

        const img = document.createElement('img');
        img.src       = IMG_SRC;
        img.alt       = "smollta";
        img.className = 'figure-img';
        img.style.height = figH + 'px';
        img.style.width  = 'auto';
        wrapper.appendChild(img);
    } else {
        const jumlahFoto = Math.floor(ratio);
        
        const totalStackH = Math.round((jumlahFoto * SMOLLTA_H) * pxPerM);
        wrapper.style.height = totalStackH + 'px';

        const topLabel = document.createElement('div');
        topLabel.className = 'fig-top-label';
        topLabel.textContent = formatNum(ratio) + " smollta";
        wrapper.appendChild(topLabel);

        if (jumlahFoto > 0) {
            const individualFigH = totalStackH / jumlahFoto;

            const stackDiv = document.createElement('div');
            stackDiv.className = 'figure-stack-div';
            stackDiv.style.width = '100%';
            stackDiv.style.height = '100%';
            stackDiv.style.position = 'absolute';
            stackDiv.style.bottom = '0';
            stackDiv.style.left = '0';
            stackDiv.style.backgroundImage = `url(${IMG_SRC})`;
            stackDiv.style.backgroundRepeat = 'repeat-y';
            stackDiv.style.backgroundPosition = 'bottom center';
            stackDiv.style.backgroundSize = `auto ${individualFigH}px`;
            
            wrapper.appendChild(stackDiv);
        }
    }

    figureArea.appendChild(wrapper);
}

document.getElementById('inputVal').addEventListener('input', hitung);

document.getElementById('unitSelectInput').addEventListener('change', function() {
    if (currentMode === 'u2s') {
        document.getElementById('inputLabel').textContent = 'tinggi (' + this.value + ')';
    }
});