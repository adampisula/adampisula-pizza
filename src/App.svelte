<script lang="ts">
  import './app.css';
  import Input from './lib/Input.svelte';
  import Output from './lib/Output.svelte';
  
  let path = '~';
  const prompt = `you@adampisula:${path} $ `;

  let list: string[] = [ 'hello' ];

  const handleSubmit = (event: CustomEvent<any>) => {
    const command: string = event.detail;

    if(command == 'clear') {
      list = [];
    } else {
      list = [...list, command];
    }
  }
</script>

<main>
  {#each list as command}
    <Output prompt={prompt} command={command} />
  {/each}
  <Input prompt={prompt} on:submit={handleSubmit} />
</main>