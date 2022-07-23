<script lang="ts">
  export let command: string;

  import { path } from '../../stores';

  const pathDisplay = $path;
</script>

<div class="text-gray-400">
  <p>{ pathDisplay }</p>
</div>