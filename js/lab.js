/* معمل الإحصاء: كل الحسابات JavaScript خالص في المتصفح */
(function () {
  'use strict';

  /* داتا الكورس: 24 طلب من المتجر التجريبي (نفس اللي في stats_data.csv) */
  var DATA = {
    revenue: [12000,4000,1200,5000,1500,3000,2000,3000,4500,4000,2500,5000,1500,3500,3000,6000,15000,8000,3000,5500,9000,21000,4500,45000],
    units: [1,2,4,1,3,1,2,1,1,2,1,1,5,1,3,2,1,4,6,1,2,3,1,1],
    delivery_days: [2,3,2,4,2,5,3,4,3,6,3,5,2,4,3,5,3,6,2,4,3,2,5,7],
    rating: [5,4,5,3,4,3,4,4,4,2,4,3,5,3,4,3,4,2,5,4,4,5,3,2]
  };

  var lab = document.getElementById('lab');

  /* ===== روابط الشريط العلوي ===== */
  document.getElementById('lab-link').onclick = function () {
    document.getElementById('hero').style.display = 'none';
    document.getElementById('lesson').style.display = 'none';
    lab.hidden = false;
  };
  document.getElementById('home-link').onclick = function () {
    lab.hidden = true;
    document.getElementById('lesson').style.display = 'none';
    document.getElementById('hero').style.display = 'block';
  };
  document.getElementById('start-btn').onclick = function () {
    document.querySelector('.nav-item').click();
  };

  /* ===== تبويبات المعمل ===== */
  document.querySelectorAll('.lab-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.lab-tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.lab-panel').forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  /* ===== دوال إحصائية ===== */
  function fmt(x) {
    if (!isFinite(x)) return '—';
    var r = Math.round(x * 100) / 100;
    return String(r);
  }
  function parseNums(txt) {
    return txt.split(/[,\s]+/).map(function (s) { return parseFloat(s); }).filter(function (v) { return isFinite(v); });
  }
  function mean(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
  function median(a) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    var m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function mode(a) {
    var freq = {}, best = null, bestN = 0, tie = false;
    a.forEach(function (x) { freq[x] = (freq[x] || 0) + 1; });
    Object.keys(freq).forEach(function (k) {
      if (freq[k] > bestN) { bestN = freq[k]; best = k; tie = false; }
      else if (freq[k] === bestN) tie = true;
    });
    return (bestN <= 1 || tie) ? null : parseFloat(best);
  }
  /* الربيعيات بطريقة pandas/NumPy الافتراضية (linear interpolation) */
  function quantile(a, p) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    var idx = p * (s.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return s[lo];
    return s[lo] + (s[hi] - s[lo]) * (idx - lo);
  }
  function variance(a, sample) {
    var m = mean(a), ss = a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0);
    return ss / (a.length - (sample ? 1 : 0));
  }
  function pearson(x, y) {
    var mx = mean(x), my = mean(y), num = 0, dx = 0, dy = 0;
    for (var i = 0; i < x.length; i++) {
      num += (x[i] - mx) * (y[i] - my);
      dx += (x[i] - mx) * (x[i] - mx);
      dy += (y[i] - my) * (y[i] - my);
    }
    return num / Math.sqrt(dx * dy);
  }
  function statCard(k, v) { return '<div class="stat-card"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>'; }

  /* ===== 1) حاسبة المقاييس ===== */
  var mInput = document.getElementById('m-input');
  document.getElementById('m-preset').addEventListener('change', function () {
    if (this.value) mInput.value = DATA[this.value].join(', ');
  });
  document.getElementById('m-run').addEventListener('click', function () {
    var a = parseNums(mInput.value), out = document.getElementById('m-out');
    if (a.length < 2) { out.innerHTML = '<p class="small">محتاج رقمين على الأقل عشان أحسب.</p>'; return; }
    var m = mean(a), pv = variance(a, false), sv = a.length > 1 ? variance(a, true) : 0;
    var q1 = quantile(a, 0.25), q3 = quantile(a, 0.75);
    var mo = mode(a);
    out.innerHTML = '<div class="stat-grid">' +
      statCard('العدد (n)', a.length) +
      statCard('المجموع (Σx)', fmt(a.reduce(function (s, x) { return s + x; }, 0))) +
      statCard('المتوسط (Mean x̄)', fmt(m)) +
      statCard('الوسيط (Median)', fmt(median(a))) +
      statCard('المنوال (Mode)', mo === null ? 'مفيش' : fmt(mo)) +
      statCard('أصغر قيمة (Min)', fmt(Math.min.apply(null, a))) +
      statCard('أكبر قيمة (Max)', fmt(Math.max.apply(null, a))) +
      statCard('المدى (Range)', fmt(Math.max.apply(null, a) - Math.min.apply(null, a))) +
      statCard('الربيع الأول (Q1)', fmt(q1)) +
      statCard('الربيع التالت (Q3)', fmt(q3)) +
      statCard('المدى الربيعي (IQR)', fmt(q3 - q1)) +
      statCard('التباين - مجتمع (σ²)', fmt(pv)) +
      statCard('الانحراف المعياري - مجتمع (σ)', fmt(Math.sqrt(pv))) +
      statCard('التباين - عينة (s²)', fmt(sv)) +
      statCard('الانحراف المعياري - عينة (s)', fmt(Math.sqrt(sv))) +
      statCard('معامل الاختلاف (CV)', fmt(100 * Math.sqrt(pv) / m) + '%') +
      '</div>' +
      '<p class="small">ليه فيه "مجتمع" و"عينة"؟ راجع درس التباين والانحراف المعياري: بنقسم على n لو دي كل البيانات، وعلى n-1 لو دي عينة من مجتمع أكبر.</p>';
  });

  /* ===== 2) الهيستوجرام ===== */
  function drawHist(a, bins, host, labelFn) {
    var mn = Math.min.apply(null, a), mx = Math.max.apply(null, a);
    var w = (mx - mn) / bins || 1;
    var counts = new Array(bins).fill(0);
    a.forEach(function (x) {
      var i = Math.min(bins - 1, Math.floor((x - mn) / w));
      counts[i]++;
    });
    var top = Math.max.apply(null, counts);
    var html = '<div class="hist">';
    counts.forEach(function (c) {
      var h = top ? Math.round(100 * c / top) : 0;
      html += '<div class="bar" style="height:' + Math.max(h, c ? 4 : 0) + '%"><span>' + c + '</span></div>';
    });
    html += '</div><div class="hist-labels">';
    counts.forEach(function (c, i) {
      html += '<div>' + (labelFn ? labelFn(mn + i * w, mn + (i + 1) * w) : fmt(mn + i * w)) + '</div>';
    });
    html += '</div>';
    host.innerHTML = html;
    return counts;
  }
  document.getElementById('h-run').addEventListener('click', function () {
    var a = DATA[document.getElementById('h-preset').value];
    var bins = Math.max(3, Math.min(12, parseInt(document.getElementById('h-bins').value, 10) || 6));
    var out = document.getElementById('h-out');
    drawHist(a, bins, out, function (lo) { return fmt(lo); });
    var m = mean(a), med = median(a);
    var skew = m > med ? 'المتوسط أكبر من الوسيط: التوزيع مائل لليمين (Right Skew) بسبب القيم الكبيرة.' : (m < med ? 'المتوسط أصغر من الوسيط: التوزيع مائل للشمال (Left Skew).' : 'المتوسط قريب من الوسيط: التوزيع شبه متماثل.');
    out.innerHTML += '<p class="small">المتوسط = ' + fmt(m) + ' والوسيط = ' + fmt(med) + '. ' + skew + '</p>';
  });

  /* ===== 3) الارتباط ===== */
  document.getElementById('c-run').addEventListener('click', function () {
    var xk = document.getElementById('c-x').value, yk = document.getElementById('c-y').value;
    var x = DATA[xk], y = DATA[yk], out = document.getElementById('c-out');
    var r = pearson(x, y);
    var W = 560, H = 320, P = 34;
    var mnx = Math.min.apply(null, x), mxx = Math.max.apply(null, x);
    var mny = Math.min.apply(null, y), mxy = Math.max.apply(null, y);
    var sx = function (v) { return P + (W - 2 * P) * (v - mnx) / ((mxx - mnx) || 1); };
    var sy = function (v) { return H - P - (H - 2 * P) * (v - mny) / ((mxy - mny) || 1); };
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:560px">';
    svg += '<line x1="' + P + '" y1="' + (H - P) + '" x2="' + (W - P) + '" y2="' + (H - P) + '" stroke="#2a3552"/>';
    svg += '<line x1="' + P + '" y1="' + P + '" x2="' + P + '" y2="' + (H - P) + '" stroke="#2a3552"/>';
    for (var i = 0; i < x.length; i++) {
      svg += '<circle cx="' + sx(x[i]) + '" cy="' + sy(y[i]) + '" r="5" fill="#3b82f6" opacity="0.8"/>';
    }
    svg += '<text x="' + (W / 2) + '" y="' + (H - 6) + '" fill="#9aa7c2" font-size="12" text-anchor="middle">' + xk + '</text>';
    svg += '<text x="12" y="' + (H / 2) + '" fill="#9aa7c2" font-size="12" transform="rotate(-90 12 ' + (H / 2) + ')" text-anchor="middle">' + yk + '</text>';
    svg += '</svg>';
    var strength = Math.abs(r) >= 0.7 ? 'قوية' : (Math.abs(r) >= 0.4 ? 'متوسطة' : 'ضعيفة');
    var dir = r > 0.05 ? 'طردية' : (r < -0.05 ? 'عكسية' : 'شبه معدومة');
    out.innerHTML = '<div class="stat-grid">' +
      statCard('معامل Pearson (r)', fmt(r)) +
      statCard('قوة العلاقة', strength) +
      statCard('الاتجاه', dir) +
      statCard('r² (نسبة التفسير)', fmt(r * r)) +
      '</div><div class="scatter-wrap">' + svg + '</div>' +
      '<p class="small">افتكر: ارتباط قوي مش معناه سببية! راجع درس "الارتباط مش سببية".</p>';
  });

  /* ===== 4) محاكي العينات ===== */
  var sampleMeans = [];
  var sOut = document.getElementById('s-out');
  function renderSampling() {
    if (!sampleMeans.length) {
      sOut.innerHTML = '<p class="small">لسه مسحبتش عينات. اضغط "اسحب عينات" وشوف.</p>';
      return;
    }
    var popMean = mean(DATA.revenue);
    var host = document.createElement('div');
    sOut.innerHTML = '';
    drawHist(sampleMeans, 10, host, function (lo) { return fmt(lo); });
    sOut.appendChild(host);
    sOut.innerHTML += '<div class="stat-grid">' +
      statCard('عدد العينات اللي سحبناها', sampleMeans.length) +
      statCard('متوسط متوسطات العينات', fmt(mean(sampleMeans))) +
      statCard('متوسط المجتمع الحقيقي', fmt(popMean)) +
      statCard('الفرق', fmt(mean(sampleMeans) - popMean)) +
      '</div>' +
      '<p class="small">كل ما تسحب عينات أكتر، متوسط المتوسطات بيقرب من متوسط المجتمع الحقيقي، وشكل التوزيع بيقرب من الجرس (Normal) حتى لو المجتمع نفسه مش طبيعي. دي Central Limit Theorem عملي.</p>';
  }
  document.getElementById('s-run').addEventListener('click', function () {
    var size = Math.max(2, Math.min(15, parseInt(document.getElementById('s-size').value, 10) || 5));
    var count = Math.max(1, Math.min(500, parseInt(document.getElementById('s-count').value, 10) || 20));
    for (var c = 0; c < count; c++) {
      var sum = 0;
      for (var i = 0; i < size; i++) {
        sum += DATA.revenue[Math.floor(Math.random() * DATA.revenue.length)];
      }
      sampleMeans.push(sum / size);
    }
    if (sampleMeans.length > 3000) sampleMeans = sampleMeans.slice(-3000);
    renderSampling();
  });
  document.getElementById('s-reset').addEventListener('click', function () {
    sampleMeans = [];
    renderSampling();
  });

  /* ===== 5) فترة الثقة و Z-Score ===== */
  document.getElementById('ci-run').addEventListener('click', function () {
    var m = parseFloat(document.getElementById('ci-mean').value);
    var s = parseFloat(document.getElementById('ci-sd').value);
    var n = parseInt(document.getElementById('ci-n').value, 10);
    var out = document.getElementById('ci-out');
    if (!isFinite(m) || !isFinite(s) || !isFinite(n) || n < 2 || s <= 0) {
      out.innerHTML = '<p class="small">راجع الأرقام: n لازم يكون 2 على الأقل والانحراف أكبر من صفر.</p>';
      return;
    }
    var se = s / Math.sqrt(n), z = 1.96;
    out.innerHTML = '<div class="stat-grid">' +
      statCard('الخطأ المعياري (SE = s/√n)', fmt(se)) +
      statCard('هامش الخطأ (1.96 × SE)', fmt(z * se)) +
      statCard('حد الفترة السفلي', fmt(m - z * se)) +
      statCard('حد الفترة العلوي', fmt(m + z * se)) +
      '</div>' +
      '<p class="small">إحنا واثقين بنسبة 95% إن متوسط المجتمع الحقيقي بين ' + fmt(m - z * se) + ' و ' + fmt(m + z * se) + '. (بنستخدم z=1.96؛ لما العينة تكون صغيرة والانحراف من العينة نفسها، الأدق t زي ما اتفقنا في الدرس.)</p>';
  });
  document.getElementById('z-run').addEventListener('click', function () {
    var x = parseFloat(document.getElementById('z-x').value);
    var m = parseFloat(document.getElementById('z-mean').value);
    var s = parseFloat(document.getElementById('z-sd').value);
    var out = document.getElementById('z-out');
    if (!isFinite(x) || !isFinite(m) || !isFinite(s) || s <= 0) {
      out.innerHTML = '<p class="small">راجع الأرقام: الانحراف المعياري لازم يكون أكبر من صفر.</p>';
      return;
    }
    var z = (x - m) / s;
    /* تقريب التوزيع الطبيعي القياسي (Abramowitz-Stegun) */
    var t = 1 / (1 + 0.2316419 * Math.abs(z));
    var d = 0.3989423 * Math.exp(-z * z / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    var phi = z > 0 ? 1 - p : p;
    out.innerHTML = '<div class="stat-grid">' +
      statCard('Z-Score', fmt(z)) +
      statCard('النسبة اللي تحت القيمة دي (تقريباً)', fmt(100 * phi) + '%') +
      '</div>' +
      '<p class="small">z = ' + fmt(z) + ' يعني القيمة ' + fmt(x) + ' بتبعد عن المتوسط بمقدار ' + fmt(Math.abs(z)) + ' انحراف معياري ' + (z >= 0 ? 'فوقه' : 'تحته') + '. القيم اللي |z| بتاعها أكبر من 3 بتعتبر Outlier واضح.</p>';
  });
})();
