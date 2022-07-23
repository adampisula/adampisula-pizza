<script lang="ts">
  export let command: string;

  import getArguments from "../../utils/getArguments";
  
  const { args } = getArguments(command);
</script>

<div class="text-gray-400">
  <p>
    Hello!<br />
    You might notice this website is a bit different from what you're most likely used to, but don't fear!
    Whenever you feel like you don't know how to navigate this site, type <span class="text-white">help</span>
    and hit Enter!
  </p>
</div>