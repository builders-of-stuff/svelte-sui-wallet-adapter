<script lang="ts">
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

<Label
  onclick={onClick}
  for={name}
  class={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground ${
    isSelected ? 'border-primary' : ''
  }`}
>
  <RadioGroup.Item value={name} id={name} class="sr-only" aria-label={name} />
  {#if typeof Icon === 'string'}
    <img src={Icon} alt={`${name} logo`} />
  {:else}
    <Icon />
  {/if}
  <div>{name}</div>
</Label>
