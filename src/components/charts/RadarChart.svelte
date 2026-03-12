<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  export let data: { axis: string; value: number }[] = [];
  export let size: number = 300;

  let container: HTMLDivElement;

  onMount(() => {
    drawChart();
  });

  $: if (container && data.length > 0) {
    drawChart();
  }

  function drawChart() {
    if (!container) return;
    
    // Clear previous
    d3.select(container).selectAll('*').remove();

    const width = size;
    const height = size;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const angleSlice = (Math.PI * 2) / data.length;

    // Draw grid
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const r = (radius / levels) * level;
      svg.append('circle')
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255,255,255,0.1)')
        .attr('stroke-width', 1);
    }

    // Draw axes
    data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      svg.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', 'rgba(255,255,255,0.2)')
        .attr('stroke-width', 1);

      // Labels
      const labelX = Math.cos(angle) * (radius + 25);
      const labelY = Math.sin(angle) * (radius + 25);

      svg.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '12px')
        .text(d.axis);
    });

    // Draw data area
    const radarLine = d3.lineRadial<{ axis: string; value: number }>()
      .radius(d => (d.value / 100) * radius)
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // Gradient
    const gradient = svg.append('defs')
      .append('radialGradient')
      .attr('id', 'radar-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0.8);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#a855f7')
      .attr('stop-opacity', 0.3);

    svg.append('path')
      .datum(data)
      .attr('d', radarLine)
      .attr('fill', 'url(#radar-gradient)')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2)
      .attr('opacity', 0)
      .transition()
      .duration(800)
      .attr('opacity', 1);

    // Draw points
    data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const r = (d.value / 100) * radius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      svg.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 0)
        .attr('fill', '#6366f1')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .transition()
        .delay(800)
        .duration(300)
        .attr('r', 5);
    });
  }
</script>

<div class="radar-chart" bind:this={container}></div>

<style>
  .radar-chart {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
