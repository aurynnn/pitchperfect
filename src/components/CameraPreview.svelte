<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let videoElement: HTMLVideoElement;
  let stream: MediaStream | null = null;
  let isReady = false;
  let error = '';

  onMount(async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });
      
      if (videoElement) {
        videoElement.srcObject = stream;
        await videoElement.play();
        isReady = true;
      }
    } catch (err) {
      console.error('Camera error:', err);
      error = 'Could not access camera. Please allow camera permissions.';
    }
  });

  onDestroy(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  });
</script>

<div class="camera-preview">
  {#if error}
    <div class="error">
      <span class="error-icon">⚠️</span>
      <p>{error}</p>
    </div>
  {:else}
    <video
      bind:this={videoElement}
      autoplay
      muted
      playsinline
      class:ready={isReady}
    ></video>
    {#if !isReady}
      <div class="loading">
        <div class="spinner"></div>
        <p>Starting camera...</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .camera-preview {
    position: relative;
    width: 100%;
    max-width: 800px;
    aspect-ratio: 16/9;
    background: #0f0f1a;
    border-radius: 16px;
    overflow: hidden;
    margin: 0 auto;
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  video.ready {
    opacity: 1;
  }

  .loading, .error {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .loading {
    color: #94a3b8;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(99, 102, 241, 0.3);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error {
    color: #f87171;
    text-align: center;
    padding: 24px;
  }

  .error-icon {
    font-size: 3rem;
  }
</style>
