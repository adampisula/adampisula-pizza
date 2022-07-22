<script lang="ts">
  export let components;
</script>

<div>
  {#each components as component}
    <svelte:component this={component} />
  {/each}
</div>