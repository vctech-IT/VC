<!-- src/lib/components/ChartComponent.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';

  Chart.register(...registerables);

  export let type: string;
  export let data: any;
  export let options: any = {};

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  onMount(() => {
    chart = new Chart(canvas, {
      type,
      data,
      options
    });
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });

  $: if (chart) {
    chart.data = data;
    chart.options = options;
    chart.update();
  }
</script>

<canvas bind:this={canvas}></canvas>