<script setup lang="ts">
import { computed } from 'vue'

function resolveAssetUrl(url: string) {
  if (url.startsWith('/'))
    return import.meta.env.BASE_URL + url.slice(1)
  return url
}

function handleBackground(background?: string, dim = false): CSSProperties {
  const isColor = background && background[0] === '#' && background.startsWith('rgb')

  const style = {
    background: isColor
      ? background
      : undefined,
    color: (background && !isColor)
      ? 'white'
      : undefined,
    backgroundImage: isColor
      ? undefined
      : background
        ? dim
          ? `linear-gradient(#0005, #0008), url(${resolveAssetUrl(background)})`
          : `url("${resolveAssetUrl(background)}")`
        : undefined,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: 'contain',
  }

  if (!style.background)
    delete style.background

  return style
}

const props = defineProps({
  image: {
    type: String,
  },
  class: {
    type: String,
  },
})

const style = computed(() => handleBackground(props.image))
</script>

<template>
  <div class="grid grid-cols-2 w-full h-full">
    <div class="w-full w-full" :style="style" />
    <div class="slidev-layout default" :class="props.class">
      <slot />
    </div>
  </div>
</template>