<script lang="ts">
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

<li>
  <button type="button" onclick={onClick}>
    {#if typeof Icon === 'string'}
      <img src={Icon} alt={`${name} logo`} />
    {:else}
      <Icon />
    {/if}
    <div>{name}</div>
  </button>
</li>
