<template>
  <div ref="scrollElement" class="virtual-scroll-container">
    <div
      :style="{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }"
    >
      <div
        v-for="virtualRow in virtualizer.getVirtualItems()"
        :key="virtualRow.key"
        :data-index="virtualRow.index"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
        }"
      >
        <slot name="item" :entry="items[virtualRow.index]" :index="virtualRow.index" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { LedgerEntry } from '~/types/models'

interface Props {
  items: LedgerEntry[]
  estimateSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  estimateSize: 80, // Default estimated height for each item
})

const scrollElement = ref<HTMLElement>()

const virtualizer = useVirtualizer({
  get count() {
    return props.items.length
  },
  getScrollElement: () => scrollElement.value,
  estimateSize: () => props.estimateSize,
  overscan: 5, // Render 5 extra items above/below viewport for smooth scrolling
})

// Measure actual sizes when items are rendered
watchEffect(() => {
  virtualizer.value.measure()
})
</script>

<style scoped>
.virtual-scroll-container {
  height: 600px; /* Adjust based on your needs */
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
