<script lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg'
  }

  let { size = 'lg' }: Props = $props()
</script>

<div class="flex justify-center py-12">
  <span class="loading loading-spinner loading-{size}"></span>
</div>
