<script lang="ts">
  export let command: string;

  import getArguments from "../../utils/getArguments";
  import { path } from "../../stores";

  const { args } = getArguments(command);

  if(args.length == 0) {
    path.set("/");
  } else {
    path.update(p => {
      if(args[0].startsWith('/')) {
        return args[0];
      } else {
        if(p.endsWith('/')) {
          return p + args[0];
        } else {
          return p + `/${args[0]}`;
        }
      }
    });
  }
</script>