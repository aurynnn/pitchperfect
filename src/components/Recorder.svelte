<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';

  export let stream: MediaStream | null = null;
  export let maxDuration: number = 80; // 80 seconds max

  const dispatch = createEventDispatcher();

  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let isRecording = false;
  let isPaused = false;
  let duration = 0;
  let interval: ReturnType<typeof setInterval>;
  let recordedBlob: Blob | null = null;

  $: progress = (duration / maxDuration) * 100;
  $: isNearLimit = duration >= maxDuration - 10;

  export function startRecording() {
    if (!stream) return;
    
    chunks = [];
    duration = 0;
    recordedBlob = null;

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(chunks, { type: 'video/webm' });
      dispatch('recorded', { blob: recordedBlob, duration });
    };

    mediaRecorder.start(1000);
    isRecording = true;

    interval = setInterval(() => {
      duration++;
      dispatch('duration', { duration, maxDuration });

      if (duration >= maxDuration) {
        stopRecording();
      }
    }, 1000);
  }

  export function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    isRecording = false;
    clearInterval(interval);
  }

  export function pauseRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      isPaused = true;
      clearInterval(interval);
    }
  }

  export function resumeRecording() {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      isPaused = false;
      interval = setInterval(() => {
        duration++;
        dispatch('duration', { duration, maxDuration });
        if (duration >= maxDuration) {
          stopRecording();
        }
      }, 1000);
    }
  }

  export function getBlob() {
    return recordedBlob;
  }

  onDestroy(() => {
    if (interval) clearInterval(interval);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  });
</script>

<div class="recorder">
  {#if !isRecording && !recordedBlob}
    <button class="record-btn" on:click={startRecording}>
      <span class="record-icon">🎬</span>
      Start Recording
    </button>
  {:else if isRecording}
    <div class="recording">
      <div class="timer" class:warning={isNearLimit}>
        {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
        <span class="max">/ {maxDuration}s</span>
      </div>
      
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progress}%"></div>
      </div>
      
      <div class="controls">
        {#if isPaused}
          <button class="control-btn" on:click={resumeRecording}>▶ Resume</button>
        {:else}
          <button class="control-btn" on:click={pauseRecording}>⏸ Pause</button>
        {/if}
        <button class="control-btn stop" on:click={stopRecording}>⏹ Stop</button>
      </div>
    </div>
  {:else if recordedBlob}
    <div class="recorded">
      <span class="check">✅</span>
      <p>Recording complete! ({duration}s)</p>
      <button class="control-btn" on:click={() => { recordedBlob = null; chunks = []; duration = 0; }}>
        🔄 Record Again
      </button>
    </div>
  {/if}
</div>

<style>
  .recorder {
    text-align: center;
    padding: 24px;
  }

  .record-btn {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 16px 32px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .record-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
  }

  .record-icon {
    font-size: 1.5rem;
  }

  .recording {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .timer {
    font-size: 2rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .timer.warning {
    color: #f87171;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    50% { opacity: 0.7; }
  }

  .max {
    font-size: 1rem;
    color: #94a3b8;
    font-weight: 400;
  }

  .progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #a855f7);
    transition: width 0.3s ease;
  }

  .controls {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .control-btn {
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .control-btn.stop {
    background: rgba(239, 68, 68, 0.3);
    border-color: rgba(239, 68, 68, 0.5);
  }

  .recorded {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .check {
    font-size: 2rem;
  }

  .recorded p {
    color: #10b981;
    font-weight: 600;
  }
</style>
