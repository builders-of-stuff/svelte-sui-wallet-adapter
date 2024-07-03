<script lang="ts">
  let {
    name,
    icon: Icon,
    isFirst = false,
    isLast = false,
    isSelected = false,
    onClick = () => {}
  } = $props<{
    name: string;
    icon: any;
    isFirst?: boolean;
    isLast?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
  }>();
</script>

<button
  onclick={onClick}
  class={`flex items-center justify-start gap-4 ${
    isFirst ? 'rounded-t-md' : isLast ? 'rounded-b-md' : 'rounded-none'
  } border ${
    isSelected ? 'border-primary' : 'border-muted'
  } bg-popover p-2 hover:bg-accent hover:text-accent-foreground ${
    !isFirst && !isLast ? 'border-t-0' : ''
  }`}
>
  {#if typeof Icon === 'string'}
    <img src={Icon} alt={`${name} logo`} style="width: 50px; height: 50px;" />
  {:else}
    <Icon />
  {/if}
  <div>{name}</div>
</button>
