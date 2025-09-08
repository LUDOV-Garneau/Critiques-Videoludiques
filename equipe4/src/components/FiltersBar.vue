<script setup>
const props = defineProps({
  minYear: Number,
  maxYear: Number,
  platforms: Array,
  selectedPlatforms: Array,
  minScore: Number,
})

const emit = defineEmits(['update:year-range', 'update:platforms', 'update:min-score'])

function onYearChange(ev, which) {
  const current = [props.minYear, props.maxYear]
  current[which === 'min' ? 0 : 1] = Number(ev.target.value)
  emit('update:year-range', current)
}

function onTogglePlatform(p) {
  const set = new Set(props.selectedPlatforms)
  if (set.has(p)) set.delete(p)
  else set.add(p)
  emit('update:platforms', Array.from(set))
}
</script>

<template>
  <section class="filters">
    <div class="row">
      <div class="group">
        <label>Année</label>
        <div class="years">
          <input type="number" :value="minYear" @input="(e) => onYearChange(e, 'min')" />
          <span>—</span>
          <input type="number" :value="maxYear" @input="(e) => onYearChange(e, 'max')" />
        </div>
      </div>

      <div class="group">
        <label>Note minimale</label>
        <input type="range" min="0" max="100" :value="minScore" @input="(e) => emit('update:min-score', Number(e.target.value))" />
        <div class="value">{{ minScore }}</div>
      </div>

      <div class="group">
        <label>Plateformes</label>
        <div class="chips">
          <button
            v-for="p in platforms"
            :key="p"
            :class="['chip', { active: selectedPlatforms.includes(p) }]"
            @click="onTogglePlatform(p)"
          >{{ p }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.filters { padding: 16px 0; border-bottom: 1px solid #e5e7eb; }
.row { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 800px) { .row { grid-template-columns: 1fr 1fr 1fr; } }
.group { display: grid; gap: 8px; }
label { font-weight: 600; color: #111827; }
.years { display: flex; align-items: center; gap: 8px; }
input[type="number"] { width: 120px; padding: 8px 10px; border-radius: 8px; border: 1px solid #e5e7eb; }
input[type="range"] { width: 100%; }
.value { color: #4b5563; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { border: 1px solid #e5e7eb; background: #ffffff; color: #111827; padding: 6px 10px; border-radius: 999px; }
.chip.active { background: #111827; color: #ffffff; border-color: #111827; }
</style>


