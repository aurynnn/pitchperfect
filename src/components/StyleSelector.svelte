<script lang="ts">
  import type { Style } from '../actions/loadStyles';

  export let styles: Style[] = [];
  export let selectedStyle: string = '';
</script>

<div class="style-selector">
  <label class="selector-label">Select Your Style</label>
  <div class="styles-grid">
    {#each styles as style}
      <button
        type="button"
        class="style-option"
        class:selected={selectedStyle === style.id}
        on:click={() => selectedStyle = style.id}
      >
        <span class="style-icon">
          {style.id === 'visionary' && '✨'}
          {style.id === 'storyteller' && '📖'}
          {style.id === 'closer' && '🎯'}
        </span>
        <span class="style-name">{style.name}</span>
        <span class="style-desc">{style.description}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .style-selector {
    margin-bottom: 32px;
  }

  .selector-label {
    display: block;
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: #e2e8f0;
  }

  .styles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .style-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
  }

  .style-option:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(99, 102, 241, 0.5);
  }

  .style-option.selected {
    background: rgba(99, 102, 241, 0.2);
    border-color: #6366f1;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
  }

  .style-icon {
    font-size: 2rem;
    margin-bottom: 8px;
  }

  .style-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 4px;
  }

  .style-desc {
    font-size: 0.85rem;
    color: #94a3b8;
  }
</style>
