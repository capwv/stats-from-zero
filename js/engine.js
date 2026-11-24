(function () {
  'use strict';

  var STORAGE_KEY = 'stats-from-zero-progress-v1';

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === 'object') {
          p.answers = p.answers || {};
          p.done = p.done || {};
          return p;
        }
      }
    } catch (e) { /* corrupted storage -> start fresh */ }
    return { answers: {}, done: {} };
  }

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (e) {}
  }

  var progress = loadProgress();

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* عرض خطوات الحساب زي ما هي، من غير تلوين كود */
  function highlight(txt) {
    return '<pre><code>' + esc(txt) + '</code></pre>';
  }

  function renderInline(text) {
    /* `code` spans inside normal text */
    return esc(text).replace(/`([^`]+)`/g, function (_, c) {
      return '<span class="kw">' + c + '</span>';
    });
  }

  /* ---------- progress ---------- */
  function totalLessons() { return CURRICULUM.length; }
  function doneCount() {
    var n = 0;
    CURRICULUM.forEach(function (l) { if (progress.done[l.id]) n++; });
    return n;
  }

  function refreshProgressUI() {
    var pct = totalLessons() ? Math.round(doneCount() / totalLessons() * 100) : 0;
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-text').textContent = pct + '%';
    CURRICULUM.forEach(function (l) {
      var el = document.querySelector('.nav-item[data-id="' + l.id + '"]');
      if (el) { el.classList.toggle('done', !!progress.done[l.id]); el.querySelector('.check').textContent=progress.done[l.id]?'✓':''; }
    });
  }

  /* ---------- nav ---------- */
  function buildNav() {
    var nav = document.getElementById('nav');
    nav.innerHTML = '';
    CURRICULUM.forEach(function (l, idx) {
      var item = document.createElement('button');
      item.type='button';
      item.className = 'nav-item';
      item.dataset.id = l.id;
      item.innerHTML = '<span class="check">' + (progress.done[l.id] ? '✓' : '') + '</span>' +
        '<span class="num">' + (idx + 1) + '</span><span>' + esc(l.nav) + '</span>';
      item.addEventListener('click', function () {
        openLesson(l.id);
        document.getElementById('sidebar').classList.remove('open');
      });
      nav.appendChild(item);
    });
  }

  /* ---------- lesson rendering ---------- */
  function renderBlocks(blocks) {
    var html = '';
    blocks.forEach(function (b) {
      if (b.type === 'p') html += '<p>' + renderInline(b.text) + '</p>';
      else if (b.type === 'h') html += '<h3>' + esc(b.text) + '</h3>';
      else if (b.type === 'code') html += highlight(b.code);
      else if (b.type === 'note') html += '<div class="note' + (b.warn ? ' warn' : '') + '">' + renderInline(b.text) + '</div>';
      else if (b.type === 'list') {
        html += '<ul>' + b.items.map(function (i) { return '<li>' + renderInline(i) + '</li>'; }).join('') + '</ul>';
      } else if (b.type === 'table') {
        html += '<table class="demo"><tr>' + b.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr>' +
          b.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') +
          '</table>';
      }
    });
    return html;
  }

  var currentLesson = null;

  function openLesson(id) {
    var lesson = null, idx = -1;
    CURRICULUM.forEach(function (l, i) { if (l.id === id) { lesson = l; idx = i; } });
    if (!lesson) return;
    currentLesson = lesson;
    document.getElementById('lab').hidden = true;
    document.getElementById('lesson').style.display = 'block';
    progress.lastLesson = id; saveProgress();

    document.getElementById('hero').style.display = 'none';
    var host = document.getElementById('lesson');

    var html = '<div class="lesson">';
    html += '<h2 class="lesson-title">' + esc(lesson.title) + '</h2>';
    html += '<div class="lesson-sub">' + esc(lesson.subtitle) + '</div>';
    html += renderBlocks(lesson.blocks);
    html += '<div class="quiz-box" id="quiz-box"><h3>🧠 اختبر نفسك</h3><div id="quiz-qs"></div><div class="quiz-result" id="quiz-result"></div></div>';
    html += '<div class="exercise-box"><h3>✍️ تمارين عملية</h3><div id="exs"></div></div>';
    html += '<div class="complete-badge" id="complete-badge">🎉 مبروك! خلصت الدرس ده. كمل اللي بعده 👇</div>';
    html += '<div class="lesson-nav">';
    html += '<button id="prev-btn"' + (idx === 0 ? ' disabled' : '') + '>→ الدرس اللي فات</button>';
    html += '<button id="next-btn" class="next-btn"' + (idx === CURRICULUM.length - 1 ? ' disabled' : '') + '>الدرس اللي بعده ←</button>';
    html += '</div></div>';

    host.innerHTML = html;

    buildQuiz(lesson);
    buildExercises(lesson);

    document.getElementById('prev-btn').addEventListener('click', function () {
      if (idx > 0) openLesson(CURRICULUM[idx - 1].id);
    });
    document.getElementById('next-btn').addEventListener('click', function () {
      if (idx < CURRICULUM.length - 1) openLesson(CURRICULUM[idx + 1].id);
    });

    document.querySelectorAll('.nav-item').forEach(function (n) {
      n.classList.toggle('active', n.dataset.id === id);
    });
    refreshProgressUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- quiz ---------- */
  function buildQuiz(lesson) {
    var qsHost = document.getElementById('quiz-qs');
    lesson.quiz.forEach(function (q, qi) {
      var box = document.createElement('div');
      box.className = 'quiz-q';
      var qid = lesson.id + ':' + qi;

      var qhtml = '<div class="q-text">' + (qi + 1) + '. ' + renderInline(q.q) + '</div>';
      if (q.code) qhtml += highlight(q.code);
      box.innerHTML = qhtml;

      var answered = progress.answers[qid];
      var fb = document.createElement('div');
      fb.className = 'feedback';

      q.options.forEach(function (opt, oi) {
        var btn = document.createElement('button');
        btn.className = 'opt';
        btn.innerHTML = opt.mono ? '<span class="mono">' + esc(opt.text) + '</span>' : renderInline(opt.text);
        btn.addEventListener('click', function () {
          if (progress.answers[qid] !== undefined) return;
          var correct = (oi === q.answer);
          progress.answers[qid] = { picked: oi, correct: correct };
          saveProgress();
          paint();
          checkQuizDone(lesson);
        });
        box.appendChild(btn);
      });
      box.appendChild(fb);
      qsHost.appendChild(box);

      function paint() {
        var rec = progress.answers[qid];
        var btns = box.querySelectorAll('.opt');
        btns.forEach(function (b, oi) {
          b.disabled = rec !== undefined;
          if (rec !== undefined) {
            if (oi === q.answer) b.classList.add('correct');
            else if (oi === rec.picked) b.classList.add('wrong');
          }
        });
        if (rec !== undefined) {
          fb.className = 'feedback ' + (rec.correct ? 'ok' : 'no');
          fb.innerHTML = (rec.correct ? '✅ صح! ' : '❌ مش دي. ') + renderInline(q.explain);
        }
      }
      paint();
    });
    checkQuizDone(lesson);
  }

  function checkQuizDone(lesson) {
    var total = lesson.quiz.length, answered = 0, correct = 0;
    lesson.quiz.forEach(function (q, qi) {
      var rec = progress.answers[lesson.id + ':' + qi];
      if (rec !== undefined) { answered++; if (rec.correct) correct++; }
    });
    var result = document.getElementById('quiz-result');
    if (answered === total && total > 0) {
      if (correct === total && !progress.done[lesson.id]) {
        progress.done[lesson.id] = true;
        saveProgress();
      }
      result.classList.add('show');
      result.innerHTML = '🏁 خلصت كويز الدرس: ' + correct + ' من ' + total + ' صح' +
        (correct === total ? ' : أداء مثالي 👏' : ' : راجع اللي غلطت فيه فوق وافهم ليه');
      if (correct===total) document.getElementById('complete-badge').classList.add('show');
      else { const retry=document.createElement('button'); retry.className='solution-toggle';retry.textContent='حاول الكويز تاني';retry.onclick=()=>{lesson.quiz.forEach((q,i)=>delete progress.answers[lesson.id+':'+i]);saveProgress();openLesson(lesson.id);};result.appendChild(retry); }
      refreshProgressUI();
    }
  }

  /* ---------- exercises ---------- */
  function buildExercises(lesson) {
    var host = document.getElementById('exs');
    lesson.exercises.forEach(function (ex, i) {
      var box = document.createElement('div');
      box.className = 'exercise';
      var html = '<div class="task">تمرين ' + (i + 1) + ': ' + renderInline(ex.task) + '</div>';
      if (ex.hint) html += '<p style="color:var(--muted);font-size:.88rem">💡 تلميح: ' + renderInline(ex.hint) + '</p>';
      html += '<label>اكتب محاولتك قبل الحل:</label><textarea class="attempt" dir="ltr" rows="4" spellcheck="false" aria-label="محاولتك"></textarea><p class="small">تقدر تتأكد من الناتج في معمل الإحصاء من الشريط فوق. المحاولة هنا للمذاكرة، مش تصحيح تلقائي.</p><button class="solution-toggle">أظهر الحل النموذجي</button>';
      html += '<div class="solution">' + highlight(ex.code) +
        (ex.why ? '<div class="why">' + renderInline(ex.why) + '</div>' : '') + '</div>';
      box.innerHTML = html;
      var btn = box.querySelector('.solution-toggle');
      var sol = box.querySelector('.solution');
      var attempt=box.querySelector('.attempt');var ak='attempt:'+lesson.id+':'+i;attempt.value=progress[ak]||'';attempt.oninput=()=>{progress[ak]=attempt.value;saveProgress();};
      btn.addEventListener('click', function () {
        sol.classList.toggle('open');
        btn.textContent = sol.classList.contains('open') ? 'إخفي الحل' : 'أظهر الحل النموذجي';
      });
      host.appendChild(box);
    });
  }

  /* ---------- reset + menu ---------- */
  document.getElementById('reset-btn').addEventListener('click', function () {
    if (confirm('متأكد إنك عايز تمسح كل تقدمك وتبدأ من الأول؟')) {
      progress = { answers: {}, done: {} };
      saveProgress();
      buildNav();
      refreshProgressUI();
      if (currentLesson) openLesson(currentLesson.id);
    }
  });

  document.getElementById('menu-toggle').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('open');
  });

  /* ---------- boot ---------- */
  buildNav();
  refreshProgressUI();
})();
