<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    open = $bindable(false),
    align = 'right',
    trigger,
    children
  }: {
    open?: boolean;
    align?: 'left' | 'right';
    trigger: Snippet;
    children: Snippet;
  } = $props();

  let rootElement = $state(null as HTMLDivElement | null);
  let menuElement = $state(null as HTMLDivElement | null);

  $effect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootElement && !rootElement.contains(event.target as Node)) {
        open = false;
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        open = false;
        return;
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
        return;
      }

      const items = Array.from(
        menuElement?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
      );
      if (!items.length) return;

      event.preventDefault();
      const activeIndex = items.indexOf(document.activeElement as HTMLElement);
      const nextIndex =
        event.key === 'ArrowDown'
          ? (activeIndex + 1) % items.length
          : (activeIndex - 1 + items.length) % items.length;
      items[nextIndex]?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="sswa-dropdown" bind:this={rootElement}>
  {@render trigger()}

  {#if open}
    <div
      class={`sswa-dropdown__menu sswa-dropdown__menu--${align}`}
      role="menu"
      tabindex="-1"
      bind:this={menuElement}
    >
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .sswa-dropdown {
    position: relative;
    display: inline-block;
  }

  .sswa-dropdown__menu {
    color-scheme: light dark;
    position: absolute;
    top: calc(100% + 0.25rem);
    z-index: 50;
    min-width: 14rem;
    padding: 0.25rem;
    border: 1px solid var(--sswa-border, light-dark(#e4e4e7, #2e2e33));
    border-radius: var(--sswa-radius, 0.75rem);
    background: var(--sswa-background, light-dark(#ffffff, #1c1c1f));
    color: var(--sswa-foreground, light-dark(#18181b, #f4f4f5));
    font-family: var(--sswa-font-sans, inherit);
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1);
    animation: sswa-dropdown-in 0.1s ease-out;
  }

  .sswa-dropdown__menu--right {
    right: 0;
  }

  .sswa-dropdown__menu--left {
    left: 0;
  }

  @keyframes sswa-dropdown-in {
    from {
      opacity: 0;
      transform: translateY(-0.25rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
