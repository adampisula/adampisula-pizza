<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';

  export let prompt;
  
  let inputValue = prompt;;

  let inputRef: HTMLTextAreaElement;
  const dispatch = createEventDispatcher();

  const resize = (element: HTMLTextAreaElement) => {
    element.style.height = '1px';
    element.style.height = `${element.scrollHeight}px`;
  }

  const handleKeypress = (e: KeyboardEvent) => {
    if(e.key == 'Enter') {
      e.preventDefault();
      
      if(inputValue.slice(prompt.length) != '') {
        submit(inputValue.slice(prompt.length));
      }
    }
  }

  const handleChange = (e: Event & { currentTarget: EventTarget & HTMLTextAreaElement }) => {
    if(!e.currentTarget.value.startsWith(prompt)) {
      inputValue = prompt;
    }

    resize(e.currentTarget);
  }

  const submit = (value: string) => {
    dispatch('submit', value);
    inputValue = prompt;
  }

  onMount(() => {
    resize(inputRef);
  });
</script>

<div>
  <textarea
    class="w-full h-auto bg-transparent border-none outline-none resize-none leading-none"
    bind:this={inputRef}
    bind:value={inputValue}
    on:keypress={handleKeypress}
    on:input={handleChange}
    spellcheck={false}
    autocapitalize="off"
    autocomplete="off"
    autofocus={true}
  />
</div>