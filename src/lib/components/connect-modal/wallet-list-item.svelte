<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
  import { Label } from '$lib/components/ui/label/index.js';

  let {
    name,
    icon: Icon,
    onClick = () => {},
    isSelected = false
  } = $props<{
    name: string;
    icon: any;
    onClick?: () => void;
    isSelected?: boolean;
  }>();
</script>

<button
  onclick={onClick}
  class={`flex items-center justify-start gap-4 rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground ${
    isSelected ? 'border-primary' : ''
  }`}
>
  {#if typeof Icon === 'string'}
    <!-- <img src={Icon} alt={`${name} logo`} /> -->

    <!-- Make it fit -->
    <img src={Icon} alt={`${name} logo`} style="width: 50px; height: 50px;" />
  {:else}
    <Icon />
  {/if}
  <div>{name}</div>
</button>
