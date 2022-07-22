<script lang="ts">
  export let prompt;
  export let command;

  import Hello from "./commands/Hello.svelte";
  import NotFound from "./commands/NotFound.svelte";

  const name = (command as string).split(' ')[0];
  const args = (command as string).split(' ').slice(1);
</script>

<div>
  <span>{ prompt }{ command }</span>
  {#if name == 'hello'}
    <Hello command={command} args={args} />
  {:else}
    <NotFound />
  {/if}
</div>