<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  export let data: { time: number; similarity: number }[] = [];
  export let width: number = 600;
  export let height: number = 200;

  let container: HTMLDivElement;

  onMount(() => {
    if (data.length > 0) drawChart();
  });

  $: if (container && data.length > 0) {
    drawChart();
  }

  function drawChart() {
    if (!container) return;
    
    d3.select(container).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.time) || 0])
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0]);

    // Gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0.4);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0);

    // Area
    const area = d3.area<{ time: number; similarity: number }>()
      .x(d => x(d.time))
      .y0(innerHeight)
      .y1(d => y(d.similarity))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    // Line
    const line = d3.line<{ time: number; similarity: number }>()
      .x(d => x(d.time))
      .y(d => y(d.similarity))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d}s`))
      .attr('color', '#64748b');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${Math.round(+d * 100)}%`))
      .attr('color', '#64748b');

    // Threshold lines
    [0.5, 0.7].forEach(threshold => {
      svg.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', y(threshold))
        .attr('y2', y(threshold))
        .attr('stroke', threshold === 0.5 ? '#f97316' : '#10b981')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.5);
    });

    // Points
    svg.selectAll('.point')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.time))
      .attr('cy', d => y(d.similarity))
      .attr('r', 4)
      .attr('fill', '#fff')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2);
  }
</script>

<div class="drift-chart" bind:this={container}></div>

<style>
  .drift-chart {
    width: 100%;
    overflow: hidden;
  }
</style>
