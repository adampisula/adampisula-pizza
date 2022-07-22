<script lang="ts">
  export let command;
  export let args;
</script>

<div class="text-gray-400">
  <p>Hello!</p>
  {#each args as argument}
    <p>Arg: <b>{ argument }</b></p>
  {/each}
</div>