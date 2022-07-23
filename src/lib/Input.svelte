<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';

  import { path } from '../stores';

  export let history: string[];

  //let prompt = `you@adampisula:${$path} $ `;
  let prompt: string;
  let inputValue: string;

  path.subscribe(value => {
    prompt = `you@adampisula:${value} $ `
    inputValue = prompt;
  });

  let historyCounter = 0;

  let inputRef: HTMLTextAreaElement;
  const dispatch = createEventDispatcher();

  const resize = (element: HTMLTextAreaElement) => {
    element.style.height = '1px';
    element.style.height = `${element.scrollHeight}px`;
  }

  const moveCursorToEnd = () => {
    inputRef.focus();
    inputRef.setSelectionRange(inputRef.value.length, inputRef.value.length);
  }

  const handleKeypress = (e: KeyboardEvent) => {
    const { key } = e;

    if(key == 'Enter') {
      e.preventDefault();
      
      if(inputValue.slice(prompt.length) != '') {
        submit(inputValue.slice(prompt.length).trim());
      }
  
      inputValue = prompt;
      historyCounter = 0;
      moveCursorToEnd();
    } else if(key == 'ArrowUp' || key == 'ArrowDown') {
      e.preventDefault();

      historyCounter += (key == 'ArrowUp') ? 1 : -1;
      historyCounter = Math.max(historyCounter, 0);
      historyCounter = Math.min(historyCounter, history.length);

      if(historyCounter == 0) {
        inputValue = prompt;
      } else {
        inputValue = `${prompt}${history[history.length - historyCounter]}`;
      }

      moveCursorToEnd();
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
    on:keyup={handleKeypress}
    on:input={handleChange}
    spellcheck={false}
    autocapitalize="off"
    autocomplete="off"
    autofocus={true}
  />
</div>