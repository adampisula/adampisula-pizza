<script lang="ts">
  export let command;
  
  import getArguments from "../../utils/getArguments";

  const commandDescriptions: any = {
    'help': {
      syntax: 'help <command?>',
      short: 'Show this help message or a command description',
      long: `
        Display a message describing what commands do what.
        &lt;command&gt; is an optional parameter. If provided, the help message for that command is shown.
      `,
    },
    'clear': 'Clear output',
    'hello': 'Display hello message',
    'pwd': 'Display current path',
    'cd': {
      syntax: 'cd <directory?>',
      short: 'Change directory (navigate)',
      long: `
        Navigate to directory &lt;directory&gt;.
        If &lt;directory&gt; has not been provided, you will be navigated to / (root of the page).
      `,
    }
  };
  
  const { args } = getArguments(command);
</script>

<div class="text-gray-400">
  {#if args.length > 0}
    <p>
      { commandDescriptions[args[0]].long || commandDescriptions[args[0]] }
    </p>
  {:else}  
    <p>This is a list of all available commands:</p>
    <ul class="list-none">
      {#each Object.keys(commandDescriptions) as commandName}
        <li>
          - <span class="text-white">{ commandDescriptions[commandName].syntax || commandName }</span> - { commandDescriptions[commandName].short || commandDescriptions[commandName] }
        </li>
      {/each}
    </ul>
  {/if}
</div>