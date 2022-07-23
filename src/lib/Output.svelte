<svelte:options immutable={true} />

<script lang="ts">
  export let command: string;

  import Hello from "./commands/Hello.svelte";
  import Help from "./commands/Help.svelte";
  import Pwd from "./commands/Pwd.svelte";
  import Cd from "./commands/Cd.svelte";
  import NotFound from "./commands/NotFound.svelte";

  import getArguments from "../utils/getArguments";
  import { path } from "../stores";

  const { name, full } = getArguments(command);

  const prompt = `you@adampisula:${$path} $ `;
</script>

<div>
  <span>{ prompt }{ command }</span>
  {#if name == 'hello'}
    <Hello command={full} />
  {:else if name == 'help'}
    <Help command={full} />
  {:else if name == 'pwd'}
    <Pwd command={full} />
  {:else if name == 'cd'}
    <Cd command={full} />
  {:else}
    <NotFound />
  {/if}
</div>