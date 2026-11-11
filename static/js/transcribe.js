/*
 * Behaviour of the "Audio Summarize" page. The same script runs on all four
 * states of the page; each init function does nothing if its elements are
 * not on the page:
 *
 *   initUpload()   - choose / drop a file, validate it, upload it with a real progress bar
 *   initProgress() - poll the server every second and draw the real progress of the job
 *   initResults()  - copy buttons and the expandable transcript
 */
(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);

    function cookie(name) {
        const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : '';
    }

    function csrfToken() {
        const input = document.querySelector('input[name=csrfmiddlewaretoken]');
        return input ? input.value : cookie('csrftoken');
    }

    function formatSize(bytes) {
        if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function formatTime(seconds) {
        seconds = Math.max(0, Math.round(seconds));
        return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    }

    function toast(message, type) {
        // showNotification() is defined in home.js (the shared page script)
        if (typeof showNotification === 'function') showNotification(message, type || 'info');
    }

    /* ------------------------------------------------------------ 1. upload */
    function initUpload() {
        const card = $('upload-card');
        if (!card) return;

        const maxMb = Number(card.dataset.maxMb) || 100;
        const allowed = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'];

        const form = $('upload-form');
        const input = $('audio-input');
        const dropZone = $('drop-zone');
        const fileInfo = $('file-info');
        const fileName = $('file-name');
        const fileMeta = $('file-meta');
        const removeBtn = $('remove-file');
        const preview = $('audio-preview');
        const submitBtn = $('submit-btn');
        const errorBox = $('form-error');
        const progressBox = $('upload-progress');
        const progressBar = $('upload-bar');
        const progressText = $('upload-percent');

        let file = null;
        let uploading = false;

        function showError(message) {
            errorBox.textContent = message || '';
            errorBox.hidden = !message;
        }

        function clearFile() {
            file = null;
            input.value = '';
            fileInfo.hidden = true;
            preview.hidden = true;
            if (preview.src) URL.revokeObjectURL(preview.src);
            preview.removeAttribute('src');
            dropZone.classList.remove('has-file');
            submitBtn.disabled = true;
        }

        function setFile(chosen) {
            showError('');
            if (!chosen) return clearFile();

            const extension = '.' + chosen.name.split('.').pop().toLowerCase();
            if (!allowed.includes(extension)) {
                clearFile();
                return showError('Unsupported file format. Please choose an MP3, WAV, M4A, OGG, FLAC or AAC file.');
            }
            if (chosen.size === 0) {
                clearFile();
                return showError('That file is empty.');
            }
            if (chosen.size > maxMb * 1024 * 1024) {
                clearFile();
                return showError('That file is ' + formatSize(chosen.size) + '. The limit is ' + maxMb + ' MB.');
            }

            file = chosen;
            fileName.textContent = chosen.name;
            fileMeta.textContent = formatSize(chosen.size);
            fileInfo.hidden = false;
            dropZone.classList.add('has-file');
            submitBtn.disabled = false;

            // audio preview + duration (read by the browser from the file itself)
            preview.src = URL.createObjectURL(chosen);
            preview.hidden = false;
            preview.onloadedmetadata = function () {
                if (isFinite(preview.duration)) {
                    fileMeta.textContent = formatSize(chosen.size) + ' · ' + formatTime(preview.duration);
                }
            };
        }

        input.addEventListener('change', () => setFile(input.files[0]));
        removeBtn.addEventListener('click', () => { if (!uploading) clearFile(); });

        ['dragenter', 'dragover'].forEach((name) => dropZone.addEventListener(name, (event) => {
            event.preventDefault();
            dropZone.classList.add('dragging');
        }));
        ['dragleave', 'drop'].forEach((name) => dropZone.addEventListener(name, (event) => {
            event.preventDefault();
            dropZone.classList.remove('dragging');
        }));
        dropZone.addEventListener('drop', (event) => {
            if (uploading || !event.dataTransfer.files.length) return;
            input.files = event.dataTransfer.files;
            setFile(input.files[0]);
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!file || uploading) return;
            uploading = true;
            showError('');
            submitBtn.disabled = true;
            submitBtn.querySelector('span').textContent = 'Uploading...';
            removeBtn.disabled = true;
            progressBox.hidden = false;

            const request = new XMLHttpRequest();
            request.open('POST', form.action);
            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            request.setRequestHeader('X-CSRFToken', csrfToken());

            // real upload progress, straight from the browser
            request.upload.onprogress = (e) => {
                if (!e.lengthComputable) return;
                const percent = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percent + '%';
                progressText.textContent = percent >= 100 ? 'Saving...' : percent + '%';
            };

            function fail(message) {
                uploading = false;
                progressBox.hidden = true;
                progressBar.style.width = '0%';
                removeBtn.disabled = false;
                submitBtn.disabled = false;
                submitBtn.querySelector('span').textContent = 'Transcribe now';
                showError(message);
            }

            request.onload = () => {
                let data = {};
                try { data = JSON.parse(request.responseText); } catch (e) { /* not JSON */ }
                if (request.status === 202 && data.job_url) {
                    window.location.href = data.job_url;
                } else if (request.status === 409 && data.job_url) {
                    fail(data.error);
                    errorBox.innerHTML = '';
                    errorBox.append(data.error + ' ');
                    const link = document.createElement('a');
                    link.href = data.job_url;
                    link.textContent = 'Go to it';
                    errorBox.append(link);
                    errorBox.hidden = false;
                } else {
                    fail(data.error || 'The upload failed (error ' + request.status + '). Please try again.');
                }
            };
            request.onerror = () => fail('Network error. Please check your connection and try again.');
            request.send(new FormData(form));
        });
    }

    /* ----------------------------------------------------------- 2. progress */
    function initProgress() {
        const card = $('progress-card');
        if (!card) return;

        const statusUrl = card.dataset.statusUrl;
        const cancelUrl = card.dataset.cancelUrl;
        const ring = $('ring-value');
        const percentText = $('percent-text');
        const messageEl = $('status-message');
        const elapsedEl = $('elapsed-text');
        const queueNote = $('queue-note');
        const equalizer = $('equalizer');
        const cancelBtn = $('cancel-btn');
        const stepEls = {};
        card.querySelectorAll('.step').forEach((li) => { stepEls[li.dataset.step] = li; });

        const circumference = 2 * Math.PI * 52;
        ring.style.strokeDasharray = circumference;

        // which of the three visible steps each backend stage belongs to
        const stepOfStage = { loading: 'prepare', converting: 'prepare', transcribing: 'transcribe', summarizing: 'summarize' };
        const stepOrder = ['prepare', 'transcribe', 'summarize'];

        let elapsedBase = 0;
        let elapsedAt = Date.now();
        let failures = 0;

        function setPercent(percent) {
            ring.style.strokeDashoffset = circumference * (1 - percent / 100);
            percentText.textContent = Math.round(percent);
            document.title = Math.round(percent) + '% · AudioBrief';
        }

        function render(s) {
            setPercent(s.progress);

            const finished = s.stage === 'finished';
            const activeStep = stepOfStage[s.stage];
            const activeIndex = finished ? stepOrder.length : stepOrder.indexOf(activeStep);

            stepOrder.forEach((name, index) => {
                const li = stepEls[name];
                li.classList.toggle('done', index < activeIndex);
                li.classList.toggle('active', index === activeIndex);
                const bar = li.querySelector('.bar-fill');
                if (bar) {
                    const known = typeof s.stage_progress === 'number';
                    bar.classList.toggle('indeterminate', index === activeIndex && !known);
                    bar.style.width = index < activeIndex ? '100%'
                        : index === activeIndex && known ? Math.round(s.stage_progress * 100) + '%' : '0%';
                }
            });

            messageEl.textContent = s.message;
            equalizer.classList.toggle('on', s.state === 'running');

            if (s.state === 'queued') {
                const n = s.queue_ahead;
                queueNote.textContent = n > 0
                    ? n + (n === 1 ? ' job is' : ' jobs are') + ' ahead of you'
                    : 'Starting...';
                queueNote.hidden = false;
            } else {
                queueNote.hidden = true;
            }

            elapsedBase = s.elapsed;
            elapsedAt = Date.now();
        }

        // keep the timer moving between server updates
        setInterval(() => {
            elapsedEl.textContent = formatTime(elapsedBase + (Date.now() - elapsedAt) / 1000);
        }, 500);

        function poll() {
            fetch(statusUrl, {
                credentials: 'same-origin',
                cache: 'no-store',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            })
                .then((response) => {
                    if (response.redirected) { window.location.reload(); return null; }   // session expired
                    return response.json();
                })
                .then((data) => {
                    if (!data) return;
                    failures = 0;
                    if (data.finished || data.state === 'missing') {
                        if (data.state === 'done') setPercent(100);
                        window.location.reload();   // the server now renders the result / error page
                        return;
                    }
                    render(data);
                    setTimeout(poll, 1000);
                })
                .catch(() => {
                    failures += 1;
                    if (failures >= 3) messageEl.textContent = 'Connection lost. Trying again...';
                    setTimeout(poll, 2000);
                });
        }

        cancelBtn.addEventListener('click', () => {
            if (!window.confirm('Cancel this job? Nothing will be saved.')) return;
            cancelBtn.disabled = true;
            messageEl.textContent = 'Cancelling...';
            fetch(cancelUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'X-CSRFToken': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
            }).then(() => window.location.reload()).catch(() => { cancelBtn.disabled = false; });
        });

        setPercent(Number(card.dataset.initialProgress) || 0);
        poll();
    }

    /* ------------------------------------------------------------ 3. results */
    function initResults() {
        const results = $('results');
        if (!results) return;

        results.querySelectorAll('.copy-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const text = $(button.dataset.target).textContent.trim();
                const done = () => toast('Copied to clipboard!', 'success');
                if (navigator.clipboard && window.isSecureContext !== false) {
                    navigator.clipboard.writeText(text).then(done, () => toast('Could not copy', 'error'));
                } else {
                    const area = document.createElement('textarea');
                    area.value = text;
                    document.body.appendChild(area);
                    area.select();
                    document.execCommand('copy');
                    area.remove();
                    done();
                }
            });
        });

        const toggle = $('toggle-transcript');
        const transcript = $('transcription-text');
        if (toggle && transcript) {
            // only offer "expand" when the text is actually longer than the box
            if (transcript.scrollHeight > transcript.clientHeight + 4) {
                transcript.classList.add('is-clipped');
            } else {
                toggle.hidden = true;
            }
            toggle.addEventListener('click', () => {
                const open = transcript.classList.toggle('expanded');
                toggle.setAttribute('aria-expanded', String(open));
                toggle.classList.toggle('open', open);
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initUpload();
        initProgress();
        initResults();
    });
})();
