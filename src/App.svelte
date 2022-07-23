<script lang="ts">
  import './app.css';
  import Input from './lib/Input.svelte';
  import Output from './lib/Output.svelte';
  
  const url = new URL(window.location.href);

  let commandLoading = false;

  let history: string[] = [];
  let list: string[] = [];

  if(url.searchParams.get('c')) {
    list = url.searchParams.get('c').split(',');
    history = JSON.parse(JSON.stringify(list));
  } else {
    list = [ 'hello' ];
    history = JSON.parse(JSON.stringify(list));
  }

  const scrollToBottom = () => {
    console.log(`Scrolling to ${document.body.scrollHeight}`);
    window.scrollTo(0, document.body.scrollHeight);
  }

  const handleSubmit = (event: CustomEvent<any>) => {
    const command: string = event.detail;

    if(command == 'clear') {
      list = [];
    } else {
      list = [...list, command];
      history = [...history, command];
    }

    scrollToBottom();
  }
</script>

<main>
  {#each list as command}
    <Output command={command} />
  {/each}
  {#if !commandLoading}
    <Input
      history={history}
      on:submit={handleSubmit}
    />
  {/if}
</main>